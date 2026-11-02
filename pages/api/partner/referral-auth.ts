import type {NextApiRequest,NextApiResponse} from "next";
import {timingSafeEqual} from "node:crypto";
import {authenticateReferralAgent,validateReferralSession,changeReferralPassword} from "../../../lib/referral-agents";

function authorized(req:NextApiRequest){
  const secret=process.env.WEB_REFERRAL_INGEST_TOKEN,actual=req.headers.authorization?.replace(/^Bearer\s+/i,"")||"";
  return !!secret&&!!actual&&Buffer.byteLength(secret)===Buffer.byteLength(actual)&&timingSafeEqual(Buffer.from(secret),Buffer.from(actual));
}
const str=(v:unknown,max=128)=>typeof v==="string"?v.slice(0,max):"";
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed."});
  if(!authorized(req))return res.status(401).json({error:"Unauthorized."});
  const body=req.body||{},action=str(body.action,30);
  try{
    if(action==="login"){
      const username=str(body.username,40),password=str(body.password,128);
      if(!username||!password)return res.status(400).json({error:"Username and password required."});
      const result=await authenticateReferralAgent(username,password);
      if(!result)return res.status(401).json({error:"Incorrect credentials or account unavailable."});
      return res.status(200).json({ok:true,session:result.session,agent:result.agent});
    }
    const agent=await validateReferralSession(str(body.session,1024));
    if(!agent)return res.status(401).json({error:"Session expired or account disabled."});
    if(action==="session")return res.status(200).json({ok:true,agent});
    if(action==="change_password"){
      const changed=await changeReferralPassword(agent.id,str(body.currentPassword,128),str(body.newPassword,128));
      if(!changed)return res.status(400).json({error:"Current password incorrect."});
      return res.status(200).json({ok:true});
    }
    return res.status(400).json({error:"Unknown action."});
  }catch(error){console.error("Referral auth failure",error);return res.status(503).json({error:"Referral authentication unavailable."});}
}