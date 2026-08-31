import { randomUUID } from "crypto";
import { Pool } from "pg";
import { type SalesCollateralDocumentType } from "./sales-collateral-types";

export interface SalesCollateral {
  id: string;
  organizationId: string;
  contactId?: string;
  contactName?: string;
  tenderOpportunityId?: string;
  tenderName?: string;
  interactionId?: string;
  interactionSubject?: string;
  gmailMessageId?: string;
  gmailThreadId?: string;
  fileName: string;
  displayName: string;
  storagePath: string;
  fileType: string;
  fileSize?: number;
  documentType: SalesCollateralDocumentType;
  description?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

let pool: Pool | undefined;
function db() {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({ connectionString, max: 2, ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: true } } : connectionString.includes("localhost") ? { ssl: false } : {}) });
  return pool;
}

function iso(value: unknown) { return value ? new Date(String(value)).toISOString() : undefined; }
function rowToCollateral(row: any): SalesCollateral {
  return {
    id: String(row.id), organizationId: String(row.organization_id),
    contactId: row.contact_id || undefined, contactName: row.contact_name || undefined,
    tenderOpportunityId: row.tender_opportunity_id || undefined, tenderName: row.tender_name || undefined,
    interactionId: row.interaction_id || undefined, interactionSubject: row.interaction_subject || undefined,
    gmailMessageId: row.gmail_message_id || undefined, gmailThreadId: row.gmail_thread_id || undefined,
    fileName: String(row.file_name), displayName: String(row.display_name), storagePath: String(row.storage_path),
    fileType: String(row.file_type), fileSize: row.file_size == null ? undefined : Number(row.file_size),
    documentType: row.document_type as SalesCollateralDocumentType, description: row.description || undefined,
    sentAt: iso(row.sent_at), createdAt: iso(row.created_at)!, updatedAt: iso(row.updated_at)!,
  };
}

const SELECT = `SELECT c.*, sc.name AS contact_name, t.name AS tender_name, i.subject AS interaction_subject,
  i.external_reference AS gmail_message_id, i.gmail_thread_id
  FROM sales_collateral c
  LEFT JOIN sales_contacts sc ON sc.id = c.contact_id
  LEFT JOIN sales_tender_opportunities t ON t.id = c.tender_opportunity_id
  LEFT JOIN sales_interactions i ON i.id = c.interaction_id`;

export async function listSalesCollateral(input: { organizationId?: string; contactId?: string; tenderOpportunityId?: string }) {
  const values: string[] = [];
  const where: string[] = [];
  if (input.organizationId) { values.push(input.organizationId); where.push(`c.organization_id = $${values.length}`); }
  if (input.contactId) { values.push(input.contactId); where.push(`c.contact_id = $${values.length}`); }
  if (input.tenderOpportunityId) { values.push(input.tenderOpportunityId); where.push(`c.tender_opportunity_id = $${values.length}`); }
  if (!where.length) throw new Error("Collateral context is required.");
  const result = await db().query(`${SELECT} WHERE ${where.join(" AND ")} ORDER BY COALESCE(c.sent_at, c.created_at) DESC, c.created_at DESC`, values);
  return result.rows.map(rowToCollateral);
}

async function assertRelations(input: { organizationId: string; contactId?: string; tenderOpportunityId?: string; interactionId?: string }) {
  if (input.contactId) {
    const r = await db().query("SELECT 1 FROM sales_contacts WHERE id=$1 AND organization_id=$2", [input.contactId, input.organizationId]);
    if (!r.rowCount) throw new Error("Contact does not belong to this organization.");
  }
  if (input.tenderOpportunityId) {
    const r = await db().query("SELECT 1 FROM sales_tender_opportunities WHERE id=$1 AND organization_id=$2", [input.tenderOpportunityId, input.organizationId]);
    if (!r.rowCount) throw new Error("Tender does not belong to this organization.");
  }
  if (input.interactionId) {
    const r = await db().query("SELECT 1 FROM sales_interactions WHERE id=$1 AND organization_id=$2", [input.interactionId, input.organizationId]);
    if (!r.rowCount) throw new Error("Interaction does not belong to this organization.");
  }
}

export async function recordSalesCollateral(input: {
  organizationId: string; contactId?: string; tenderOpportunityId?: string; interactionId?: string;
  fileName: string; displayName: string; storagePath: string; fileType: string; fileSize?: number;
  documentType: SalesCollateralDocumentType; description?: string; sentAt?: string;
}) {
  await assertRelations(input);
  const existing = input.interactionId ? await db().query(
    "SELECT id FROM sales_collateral WHERE organization_id=$1 AND interaction_id=$2 AND LOWER(file_name)=LOWER($3) LIMIT 1",
    [input.organizationId, input.interactionId, input.fileName]
  ) : await db().query("SELECT id FROM sales_collateral WHERE storage_path=$1 LIMIT 1", [input.storagePath]);
  if (existing.rows[0]) return { collateral: await getSalesCollateral(String(existing.rows[0].id)), created: false };
  const id = randomUUID();
  const now = new Date().toISOString();
  await db().query(`INSERT INTO sales_collateral
    (id,organization_id,contact_id,tender_opportunity_id,interaction_id,file_name,display_name,storage_path,file_type,file_size,document_type,description,sent_at,created_at,updated_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
    [id,input.organizationId,input.contactId||null,input.tenderOpportunityId||null,input.interactionId||null,input.fileName,input.displayName,input.storagePath,input.fileType,input.fileSize??null,input.documentType,input.description||null,input.sentAt||null,now]);
  return { collateral: await getSalesCollateral(id), created: true };
}

export async function getSalesCollateral(id: string) {
  const result = await db().query(`${SELECT} WHERE c.id=$1`, [id]);
  return result.rows[0] ? rowToCollateral(result.rows[0]) : null;
}

export async function updateSalesCollateral(input: { id: string; organizationId: string; contactId?: string; tenderOpportunityId?: string; interactionId?: string; displayName: string; documentType: SalesCollateralDocumentType; description?: string; sentAt?: string }) {
  await assertRelations(input);
  const result = await db().query(`UPDATE sales_collateral SET contact_id=$3,tender_opportunity_id=$4,interaction_id=$5,display_name=$6,document_type=$7,description=$8,sent_at=$9,updated_at=$10 WHERE id=$1 AND organization_id=$2 RETURNING id`,
    [input.id,input.organizationId,input.contactId||null,input.tenderOpportunityId||null,input.interactionId||null,input.displayName,input.documentType,input.description||null,input.sentAt||null,new Date().toISOString()]);
  if (!result.rowCount) throw new Error("Collateral not found.");
  return getSalesCollateral(input.id);
}

export async function deleteSalesCollateral(id: string, organizationId: string) {
  const result = await db().query("DELETE FROM sales_collateral WHERE id=$1 AND organization_id=$2 RETURNING storage_path", [id, organizationId]);
  if (!result.rows[0]) throw new Error("Collateral not found.");
  return String(result.rows[0].storage_path);
}

export async function getSalesCollateralContext(input: { organizationId?: string; tenderOpportunityId?: string }) {
  let organizationId = input.organizationId;
  if (!organizationId && input.tenderOpportunityId) {
    const r = await db().query("SELECT organization_id FROM sales_tender_opportunities WHERE id=$1", [input.tenderOpportunityId]);
    organizationId = r.rows[0]?.organization_id;
  }
  if (!organizationId) throw new Error("Organization not found for collateral context.");
  const [contacts, tenders, interactions] = await Promise.all([
    db().query("SELECT id,name,email FROM sales_contacts WHERE organization_id=$1 ORDER BY name", [organizationId]),
    db().query("SELECT id,name,reference_number FROM sales_tender_opportunities WHERE organization_id=$1 ORDER BY COALESCE(submission_deadline, created_at) DESC", [organizationId]),
    db().query("SELECT id,subject,occurred_at,external_reference,gmail_thread_id FROM sales_interactions WHERE organization_id=$1 AND direction='OUTBOUND' ORDER BY occurred_at DESC LIMIT 100", [organizationId]),
  ]);
  return { organizationId: String(organizationId), contacts: contacts.rows, tenders: tenders.rows, interactions: interactions.rows };
}
