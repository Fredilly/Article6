import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { Pool } from "pg";

let pool: Pool | undefined;
function db() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) throw Error("CRM database is not configured.");
    pool = new Pool({ connectionString, max: 3, ...(process.env.NODE_ENV === "production" ? {ssl: {rejectUnauthorized:true}} : connectionString.includes("localhost") ? {ssl:false} : {}) });
  }
  return pool;
}
export type ReferralAgent = { id: string; username: string; displayName: string; active: boolean; createdAt: string; referralCount?: number };
function publicAgent(row: any): ReferralAgent {
  return { id: String(row.id), username: String(row.username), displayName: String(row.display_name), active: Boolean(row.active), createdAt: new Date(row.created_at).toISOString(), ...(row.referral_count != null ? {referralCount:Number(row.referral_count)} : {}) };
}
function hashPassword(password: string, salt: string) {return scryptSync(password, Buffer.from(salt, "hex"), 64).toString("hex");}
function generatePassword() {return randomBytes(21).toString("base64url");}
export async function listReferralAgents() {
  const result = await db().query("SELECT a.id, a.username, a.display_name, a.active, a.created_at, COUNT(r.id)::int AS referral_count FROM sales_referral_agents a LEFT JOIN sales_partner_referrals r ON r.agent_id=a.id GROUP BY a.id ORDER BY a.created_at DESC");
  return result.rows.map(publicAgent);
}
export async function createReferralAgent(username: string, displayName: string) {
  if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(username) || !displayName.trim() || displayName.length > 100) throw Error("Enter a valid username and display name.");
  const password = generatePassword(), salt = randomBytes(16).toString("hex");
  const result = await db().query(`INSERT INTO sales_referral_agents(id,username,display_name,password_salt,password_hash)
    VALUES($1,$2,$3,$4,$5) RETURNING *`, [randomUUID(),username,displayName.trim(),salt,hashPassword(password,salt)]);
  return { agent: publicAgent(result.rows[0]), temporaryPassword: password };
}
export async function setReferralAgentActive(id: string, active: boolean) {
  const result = await db().query(`UPDATE sales_referral_agents SET active=$2,session_version=session_version+1,updated_at=NOW() WHERE id=$1 RETURNING id`,[id,active]);
  if (!result.rows[0]) throw Error("Agent not found.");
}
export async function resetReferralPassword(id: string) {
  const password=generatePassword(),salt=randomBytes(16).toString("hex");
  const result=await db().query(`UPDATE sales_referral_agents SET password_salt=$2,password_hash=$3,
    session_version=session_version+1,failed_attempts=0,locked_until=NULL,updated_at=NOW() WHERE id=$1 RETURNING id`,
    [id,salt,hashPassword(password,salt)]);
  if(!result.rows[0])throw Error("Agent not found.");
  return password;
}
function sign(value: string) {
  const key=process.env.WEB_REFERRAL_INGEST_TOKEN;
  if (!key) throw Error("Referral service authentication not configured.");
  return createHmac("sha256", key).update("referral-session-v1:"+value).digest("base64url");
}
export function issueReferralSession(agent: {id:string;session_version:number}) {
  const data=Buffer.from(JSON.stringify({id:agent.id,v:agent.session_version,exp:Date.now()+8*3600_000})).toString("base64url");
  return data+"."+sign(data);
}
export async function validateReferralSession(token: string): Promise<ReferralAgent | null> {
  if(!token || token.length>1024) return null;
  const parts=token.split(".");
  if(parts.length!==2)return null;
  const expected=sign(parts[0]),provided=parts[1];
  if(Buffer.byteLength(expected)!==Buffer.byteLength(provided)||!timingSafeEqual(Buffer.from(expected),Buffer.from(provided)))return null;
  let payload: {id?:string;v?:number;exp?:number};
  try { payload=JSON.parse(Buffer.from(parts[0],"base64url").toString("utf8")); } catch {return null;}
  if(!payload.id||typeof payload.exp!=="number"||!Number.isFinite(payload.exp)||payload.exp<Date.now()||payload.exp>Date.now()+8*3600_000)return null;
  const result=await db().query("SELECT * FROM sales_referral_agents WHERE id=$1 AND active=TRUE",[payload.id]);
  const row=result.rows[0];
  if(!row||row.session_version!==payload.v)return null;
  return publicAgent(row);
}
export async function authenticateReferralAgent(username:string,password:string) {
  const result=await db().query("SELECT * FROM sales_referral_agents WHERE username=$1",[username.toLowerCase().trim()]);
  const row=result.rows[0];
  // Comparable password-work for unknown accounts without disclosing account existence.
  const fallbackSalt="6c2e4d06ba30435c7c1941bff2abe9dd";
  const computed=hashPassword(password,row?.password_salt||fallbackSalt);
  const expected=row?.password_hash||hashPassword("not-a-real-password",fallbackSalt);
  const equal=timingSafeEqual(Buffer.from(computed,"hex"),Buffer.from(expected,"hex"));
  if(!row||!row.active||row.locked_until&&new Date(row.locked_until).getTime()>Date.now()||!equal){
    if(row?.active)await db().query(`UPDATE sales_referral_agents SET failed_attempts=failed_attempts+1,
      locked_until=CASE WHEN failed_attempts+1>=5 THEN NOW()+INTERVAL '15 minutes' ELSE locked_until END
      WHERE id=$1`,[row.id]);
    return null;
  }
  await db().query("UPDATE sales_referral_agents SET failed_attempts=0,locked_until=NULL WHERE id=$1",[row.id]);
  return {agent:publicAgent(row),session:issueReferralSession(row)};
}
export async function changeReferralPassword(id:string,oldPassword:string,newPassword:string) {
  if(newPassword.length<14||newPassword.length>128||newPassword===oldPassword)throw Error("Choose a new password of at least 14 characters.");
  const result=await db().query("SELECT * FROM sales_referral_agents WHERE id=$1 AND active=TRUE",[id]);
  const row=result.rows[0];
  if(!row)return false;
  const computed=Buffer.from(hashPassword(oldPassword,row.password_salt),"hex");
  if(!timingSafeEqual(computed,Buffer.from(row.password_hash,"hex")))return false;
  const salt=randomBytes(16).toString("hex");
  await db().query(`UPDATE sales_referral_agents SET password_salt=$2,password_hash=$3,session_version=session_version+1,
    updated_at=NOW() WHERE id=$1`,[id,salt,hashPassword(newPassword,salt)]);
  return true;
}

export async function recordReferralAttribution(input:{
  agentId:string; organizationId:string;contactId:string;service:string;interest:string;budget:string;notes:string
}) {
  await db().query(`INSERT INTO sales_partner_referrals
    (id,agent_id,organization_id,contact_id,service,interest,budget,notes)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [randomUUID(),input.agentId,input.organizationId,input.contactId,input.service,input.interest,input.budget||null,input.notes||null]);
}

export interface PartnerReferralSummary {
  id:string; company:string; service:string; interest:string; status:string; createdAt:string;
}
export async function listOwnPartnerReferrals(agentId:string):Promise<PartnerReferralSummary[]> {
  const result=await db().query(`SELECT r.id,o.name AS company,r.service,r.interest,o.status,r.created_at
    FROM sales_partner_referrals r
    JOIN sales_organizations o ON o.id=r.organization_id
    WHERE r.agent_id=$1
    ORDER BY r.created_at DESC LIMIT 100`,[agentId]);
  return result.rows.map(row=>({
    id:String(row.id),company:String(row.company),service:String(row.service),
    interest:String(row.interest),status:String(row.status),
    createdAt:new Date(row.created_at).toISOString()
  }));
}
