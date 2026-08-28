import { randomUUID } from "crypto";
import { Pool, type QueryResultRow } from "pg";
import {
  normalizeDomain,
  normalizeOrganizationName,
  type SalesExperiment,
  type SalesObjectionCode,
  type SalesOrganizationStatus,
} from "./sales-memory";
import { normalizeSalesInteractionTimestamp } from "./sales-timestamps";
import { normalizeSalesDateTime } from "./sales-dates";
import { canonicalSalesProjectName, normalizeSalesProjectOrganizationRole, normalizeSalesVcsId, type SalesProjectRollupStatus } from "./sales-projects";

export interface SalesOrganization {
  id: string;
  name: string;
  domain?: string;
  country?: string;
  experiment: SalesExperiment;
  status: SalesOrganizationStatus;
  objectionCode?: SalesObjectionCode;
  internalCertificationTeam?: boolean;
  notes: string;
  doNotContact: boolean;
  assignedOwner?: string;
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
  updatedAt: string;
  contactCount?: number;
  projectCount?: number;
  lastInteractionAt?: string;
}

export interface SalesContact {
  id: string;
  organizationId: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  status: string;
  notes: string;
}

export interface SalesProject {
  id: string;
  vcsId?: string;
  name: string;
  methodology?: string;
  methodologyVersion?: string;
  stage?: string;
  country?: string;
  vvb?: string;
  notes: string;
  salesStatus: SalesOrganizationStatus;
  assignedOwner?: string;
  nextAction?: string;
  nextActionDate?: string;
  documents: SalesProjectDocument[];
  role?: string;
  stakeholderCount?: number;
  stakeholderNames?: string[];
  rolledUpStatus?: SalesProjectRollupStatus;
  blocked?: boolean;
  contacts: SalesProjectContact[];
}

export interface SalesProjectContact {
  id: string;
  projectId: string;
  contactId: string;
  contactName: string;
  contactTitle?: string;
  organizationId: string;
  organizationName: string;
  role: string;
}

export interface SalesProjectDocument {
  id: string;
  projectId: string;
  name: string;
  documentType: string;
  requested: boolean;
  received: boolean;
  receivedAt?: string;
  notes: string;
}

export type SalesTenderStatus = "NEW" | "DOCUMENTS_REQUESTED" | "DOCUMENTS_RECEIVED" | "SUBMITTED" | "AWARDED" | "NOT_AWARDED";

export interface SalesTenderDocument {
  id: string;
  tenderOpportunityId: string;
  name: string;
  requested: boolean;
  received: boolean;
  receivedAt?: string;
  notes: string;
}

export interface SalesTenderOpportunity {
  id: string;
  organizationId: string;
  contactId?: string;
  contactName?: string;
  name: string;
  buyer?: string;
  referenceNumber?: string;
  submissionDeadline?: string;
  contractValue?: number;
  sector?: string;
  status: SalesTenderStatus;
  bidderStatus?: string;
  notes: string;
  buyerRequirements: string;
  salesStatus: SalesOrganizationStatus;
  assignedOwner?: string;
  nextAction?: string;
  nextActionDate?: string;
  documentsRequested: number;
  documentsReceived: number;
  documents: SalesTenderDocument[];
  interactions: SalesInteraction[];
}

export interface SalesInteraction {
  id: string;
  organizationId: string;
  contactId?: string;
  projectId?: string;
  tenderOpportunityId?: string;
  contactName?: string;
  projectName?: string;
  channel: string;
  direction: string;
  interactionType: string;
  occurredAt: string;
  subject?: string;
  summary: string;
  outcomeCode?: string;
  externalReference?: string;
  gmailThreadId?: string;
}

export interface SalesOrganizationDetail {
  organization: SalesOrganization;
  contacts: SalesContact[];
  projects: SalesProject[];
  tenderOpportunities: SalesTenderOpportunity[];
  interactions: SalesInteraction[];
}

export type SalesActionQueueKind = "CARBON" | "TENDER";

export interface SalesActionQueueItem {
  id: string;
  kind: SalesActionQueueKind;
  organizationId: string;
  organizationName: string;
  title: string;
  status: SalesOrganizationStatus;
  assignedOwner?: string;
  nextAction?: string;
  nextActionDate?: string;
  hasOutreach: boolean;
}

let pool: Pool | undefined;
let gmailThreadColumnAvailable: Promise<boolean> | undefined;
function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  pool = new Pool({
    connectionString,
    max: 3,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return pool;
}

async function hasGmailThreadColumn(): Promise<boolean> {
  if (!gmailThreadColumnAvailable) {
    gmailThreadColumnAvailable = getPool().query(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'sales_interactions'
           AND column_name = 'gmail_thread_id'
       ) AS available`
    ).then((result) => Boolean(result.rows[0]?.available));
  }
  return gmailThreadColumnAvailable;
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function toOrganization(row: QueryResultRow): SalesOrganization {
  return {
    id: String(row.id),
    name: String(row.name),
    domain: row.domain || undefined,
    country: row.country || undefined,
    experiment: (row.experiment || "ARTICLE6_CARBON") as SalesExperiment,
    status: row.status as SalesOrganizationStatus,
    objectionCode: row.objection_code || undefined,
    internalCertificationTeam: row.internal_certification_team == null ? undefined : Boolean(row.internal_certification_team),
    notes: String(row.notes || ""),
    doNotContact: Boolean(row.do_not_contact),
    assignedOwner: row.assigned_owner || undefined,
    nextAction: row.next_action || undefined,
    nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    contactCount: row.contact_count == null ? undefined : Number(row.contact_count),
    projectCount: row.project_count == null ? undefined : Number(row.project_count),
    lastInteractionAt: row.last_interaction_at ? iso(row.last_interaction_at) : undefined,
  };
}

export async function listSalesOrganizations(search = ""): Promise<SalesOrganization[]> {
  const q = search.trim();
  const result = await getPool().query(
    `SELECT o.*,
      (SELECT COUNT(*) FROM sales_contacts c WHERE c.organization_id = o.id) AS contact_count,
      (SELECT COUNT(*) FROM sales_organization_projects op WHERE op.organization_id = o.id) AS project_count,
      (SELECT MAX(i.occurred_at) FROM sales_interactions i WHERE i.organization_id = o.id) AS last_interaction_at
     FROM sales_organizations o
     WHERE $1 = ''
        OR o.name ILIKE '%' || $1 || '%'
        OR COALESCE(o.domain, '') ILIKE '%' || $1 || '%'
        OR COALESCE(o.experiment, '') ILIKE '%' || $1 || '%'
        OR EXISTS (SELECT 1 FROM sales_contacts c WHERE c.organization_id = o.id AND (c.name ILIKE '%' || $1 || '%' OR COALESCE(c.email, '') ILIKE '%' || $1 || '%'))
        OR EXISTS (SELECT 1 FROM sales_organization_projects op JOIN sales_projects p ON p.id = op.project_id WHERE op.organization_id = o.id AND (p.name ILIKE '%' || $1 || '%' OR COALESCE(p.vcs_id, '') ILIKE '%' || $1 || '%' OR COALESCE(p.methodology, '') ILIKE '%' || $1 || '%'))
     ORDER BY COALESCE((SELECT MAX(i.occurred_at) FROM sales_interactions i WHERE i.organization_id = o.id), o.updated_at) DESC, o.name ASC`,
    [q]
  );
  return result.rows.map(toOrganization);
}

export async function listSalesActionQueue(kind: SalesActionQueueKind): Promise<SalesActionQueueItem[]> {
  const result = await getPool().query(
    `SELECT id, kind, organization_id, organization_name, title, status, assigned_owner, next_action, next_action_date, has_outreach
     FROM (
       SELECT p.id, 'CARBON'::text AS kind, canonical.organization_id, canonical.organization_name, p.name AS title,
         p.sales_status AS status, p.assigned_owner, p.next_action, p.next_action_date,
         EXISTS (SELECT 1 FROM sales_interactions i WHERE i.project_id = p.id) AS has_outreach
       FROM sales_projects p
       JOIN (
         SELECT DISTINCT ON (op.project_id) op.project_id, o.id AS organization_id, o.name AS organization_name
         FROM sales_organization_projects op
         JOIN sales_organizations o ON o.id = op.organization_id
         ORDER BY op.project_id, o.id
       ) canonical ON canonical.project_id = p.id
       WHERE p.sales_status NOT IN ('CLOSED_WON', 'CLOSED_NO', 'DO_NOT_CONTACT', 'PARKED')
       UNION ALL
       SELECT t.id, 'TENDER'::text AS kind, o.id AS organization_id, o.name AS organization_name, t.name AS title,
         t.sales_status AS status, t.assigned_owner, t.next_action, t.next_action_date,
         EXISTS (SELECT 1 FROM sales_interactions i WHERE i.tender_opportunity_id = t.id) AS has_outreach
       FROM sales_tender_opportunities t
       JOIN sales_organizations o ON o.id = t.organization_id
       WHERE t.sales_status NOT IN ('CLOSED_WON', 'CLOSED_NO', 'DO_NOT_CONTACT', 'PARKED')
     ) queue
     WHERE kind = $1
     ORDER BY CASE status
                WHEN 'OPPORTUNITY' THEN 1
                WHEN 'ENGAGED' THEN 2
                WHEN 'CONTACTED' THEN 3
                WHEN 'NURTURE' THEN 3
                WHEN 'NEW' THEN 4
                ELSE 5
              END ASC,
              CASE WHEN next_action_date IS NOT NULL AND next_action_date < CURRENT_TIMESTAMP THEN 0 ELSE 1 END ASC,
              (next_action_date IS NULL) ASC,
              next_action_date ASC NULLS LAST,
              title ASC,
              id ASC`,
    [kind]
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    kind: row.kind as SalesActionQueueKind,
    organizationId: String(row.organization_id),
    organizationName: String(row.organization_name),
    title: String(row.title),
    status: row.status as SalesOrganizationStatus,
    assignedOwner: row.assigned_owner || undefined,
    nextAction: row.next_action || undefined,
    nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined,
    hasOutreach: Boolean(row.has_outreach),
  }));
}

export async function createSalesOrganization(input: { name: string; domain?: string; country?: string; experiment?: SalesExperiment; notes?: string }): Promise<{ organization: SalesOrganization; created: boolean }> {
  const now = new Date().toISOString();
  const normalizedName = normalizeOrganizationName(input.name);
  const domain = normalizeDomain(input.domain || "");
  const existing = await getPool().query(
    `SELECT * FROM sales_organizations WHERE normalized_name = $1 OR ($2::text IS NOT NULL AND domain = $2) LIMIT 1`,
    [normalizedName, domain]
  );
  if (existing.rows[0]) return { organization: toOrganization(existing.rows[0]), created: false };
  const result = await getPool().query(
    `INSERT INTO sales_organizations (id, name, normalized_name, domain, country, experiment, status, notes, do_not_contact, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'NEW',$7,FALSE,$8,$8) RETURNING *`,
    [randomUUID(), input.name.trim(), normalizedName, domain, input.country?.trim() || null, input.experiment || "ARTICLE6_CARBON", input.notes?.trim() || "", now]
  );
  return { organization: toOrganization(result.rows[0]), created: true };
}

export async function addSalesContact(input: { organizationId: string; name: string; title?: string; email?: string; phone?: string; notes?: string }): Promise<SalesContact> {
  const now = new Date().toISOString();
  const email = input.email?.trim().toLowerCase() || null;
  if (email) {
    const duplicate = await getPool().query("SELECT organization_id FROM sales_contacts WHERE LOWER(email) = $1 LIMIT 1", [email]);
    if (duplicate.rows[0]) throw new Error(`Contact email already exists on organization ${duplicate.rows[0].organization_id}.`);
  }
  const duplicateName = await getPool().query("SELECT id FROM sales_contacts WHERE organization_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1", [input.organizationId, input.name]);
  if (duplicateName.rows[0]) throw new Error("A contact with this name already exists on this organization.");
  const result = await getPool().query(
    `INSERT INTO sales_contacts (id, organization_id, name, title, email, phone, status, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$8) RETURNING *`,
    [randomUUID(), input.organizationId, input.name.trim(), input.title?.trim() || null, email, input.phone?.trim() || null, input.notes?.trim() || "", now]
  );
  const row = result.rows[0];
  return { id: String(row.id), organizationId: String(row.organization_id), name: String(row.name), title: row.title || undefined, email: row.email || undefined, phone: row.phone || undefined, status: String(row.status), notes: String(row.notes || "") };
}

export async function updateSalesContact(input: { organizationId: string; contactId: string; name: string; title?: string; email?: string; phone?: string; notes?: string }): Promise<void> {
  const email = input.email?.trim().toLowerCase() || null;
  if (email) {
    const duplicate = await getPool().query(
      "SELECT id FROM sales_contacts WHERE LOWER(email) = $1 AND id <> $2 LIMIT 1",
      [email, input.contactId]
    );
    if (duplicate.rows[0]) throw new Error("Another contact already uses this email.");
  }
  const result = await getPool().query(
    `UPDATE sales_contacts
     SET name=$3, title=$4, email=$5, phone=$6, notes=$7, updated_at=$8
     WHERE id=$1 AND organization_id=$2`,
    [input.contactId, input.organizationId, input.name.trim(), input.title?.trim() || null, email, input.phone?.trim() || null, input.notes?.trim() || "", new Date().toISOString()]
  );
  if (!result.rowCount) throw new Error("Contact not found for this organization.");
}

export async function deleteSalesContact(organizationId: string, contactId: string): Promise<void> {
  const result = await getPool().query(
    "DELETE FROM sales_contacts WHERE id = $1 AND organization_id = $2 RETURNING id",
    [contactId, organizationId]
  );
  if (!result.rows[0]) throw new Error("Contact not found for this organization.");
}

export async function deleteSalesOrganization(organizationId: string): Promise<void> {
  const result = await getPool().query("DELETE FROM sales_organizations WHERE id = $1 RETURNING id", [organizationId]);
  if (!result.rows[0]) throw new Error("Organization not found.");
}

export async function mergeSalesOrganizations(sourceId: string, targetId: string): Promise<void> {
  if (!sourceId || !targetId || sourceId === targetId) throw new Error("Choose two different organizations to merge.");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const organizations = await client.query("SELECT id FROM sales_organizations WHERE id = ANY($1::uuid[])", [[sourceId, targetId]]);
    if (organizations.rowCount !== 2) throw new Error("Both organizations must exist before merging.");
    const contacts = await client.query("SELECT id, email FROM sales_contacts WHERE organization_id = $1", [sourceId]);
    for (const contact of contacts.rows) {
      const existing = contact.email ? await client.query("SELECT id FROM sales_contacts WHERE organization_id = $1 AND LOWER(email) = LOWER($2) LIMIT 1", [targetId, contact.email]) : { rows: [] };
      if (existing.rows[0]) {
        await client.query("UPDATE sales_interactions SET contact_id = $2 WHERE contact_id = $1", [contact.id, existing.rows[0].id]);
        await client.query("DELETE FROM sales_contacts WHERE id = $1", [contact.id]);
      } else {
        await client.query("UPDATE sales_contacts SET organization_id = $2, updated_at = NOW() WHERE id = $1", [contact.id, targetId]);
      }
    }
    await client.query("UPDATE sales_interactions SET organization_id = $2 WHERE organization_id = $1", [sourceId, targetId]);
    await client.query("UPDATE sales_tender_opportunities SET organization_id = $2, updated_at = NOW() WHERE organization_id = $1", [sourceId, targetId]);
    await client.query("INSERT INTO sales_organization_projects (organization_id, project_id, role, created_at) SELECT $2, project_id, role, created_at FROM sales_organization_projects WHERE organization_id = $1 ON CONFLICT (organization_id, project_id) DO NOTHING", [sourceId, targetId]);
    await client.query("DELETE FROM sales_organization_projects WHERE organization_id = $1", [sourceId]);
    await client.query("DELETE FROM sales_organizations WHERE id = $1", [sourceId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function addSalesProject(input: { organizationId: string; vcsId?: string; name: string; methodology?: string; methodologyVersion?: string; stage?: string; country?: string; vvb?: string; role?: string; notes?: string; salesStatus?: SalesOrganizationStatus; assignedOwner?: string; nextAction?: string; nextActionDate?: string }): Promise<SalesProject & { duplicate: boolean }> {
  const now = new Date().toISOString();
  const vcsId = normalizeSalesVcsId(input.vcsId) || null;
  let projectRow: QueryResultRow | undefined;
  if (vcsId) {
    projectRow = (await getPool().query("SELECT * FROM sales_projects WHERE vcs_id = $1 LIMIT 1", [vcsId])).rows[0];
  } else {
    projectRow = (await getPool().query(
      `SELECT p.* FROM sales_projects p
       JOIN sales_organization_projects op ON op.project_id = p.id
       WHERE op.organization_id = $1 AND LOWER(TRIM(p.name)) = LOWER(TRIM($2)) LIMIT 1`,
      [input.organizationId, input.name]
    )).rows[0];
  }
  const duplicate = Boolean(projectRow);
  if (!projectRow) {
    projectRow = (await getPool().query(
      `INSERT INTO sales_projects (id, vcs_id, name, methodology, methodology_version, stage, country, vvb, sales_status, assigned_owner, next_action, next_action_date, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14) RETURNING *`,
      [randomUUID(), vcsId, canonicalSalesProjectName(vcsId || undefined, input.name), input.methodology?.trim() || null, input.methodologyVersion?.trim() || null, input.stage?.trim() || null, input.country?.trim() || null, input.vvb?.trim() || null, input.salesStatus || "NEW", input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), input.notes?.trim() || "", now]
    )).rows[0];
  }
  if (!projectRow) throw new Error("Project could not be created or resolved.");
  const resolvedProjectRow = projectRow;
  if (projectRow.id) {
    await getPool().query(
      `UPDATE sales_projects
       SET name=$2, methodology=COALESCE(NULLIF($3, ''), methodology), methodology_version=COALESCE(NULLIF($4, ''), methodology_version), stage=COALESCE(NULLIF($5, ''), stage), country=COALESCE(NULLIF($6, ''), country), vvb=COALESCE(NULLIF($7, ''), vvb), sales_status=$8, assigned_owner=COALESCE(NULLIF($9, ''), assigned_owner), next_action=COALESCE(NULLIF($10, ''), next_action), next_action_date=COALESCE($11, next_action_date), notes=COALESCE(NULLIF($12, ''), notes), updated_at=$13
       WHERE id=$1`,
      [projectRow.id, canonicalSalesProjectName(vcsId || undefined, input.name), input.methodology?.trim() || "", input.methodologyVersion?.trim() || "", input.stage?.trim() || "", input.country?.trim() || "", input.vvb?.trim() || "", input.salesStatus || "NEW", input.assignedOwner?.trim() || "", input.nextAction?.trim() || "", normalizeSalesDateTime(input.nextActionDate), input.notes?.trim() || "", now]
    );
    projectRow = (await getPool().query("SELECT * FROM sales_projects WHERE id = $1", [resolvedProjectRow.id])).rows[0];
  }
  if (!projectRow) throw new Error("Project could not be refreshed after deduplication.");
  const finalProjectRow = projectRow;
  await getPool().query(
    `INSERT INTO sales_organization_projects (organization_id, project_id, role, created_at)
     VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id, project_id) DO UPDATE SET role = EXCLUDED.role`,
    [input.organizationId, finalProjectRow.id, normalizeSalesProjectOrganizationRole(input.role), now]
  );
  return { id: String(finalProjectRow.id), vcsId: finalProjectRow.vcs_id || undefined, name: String(finalProjectRow.name), methodology: finalProjectRow.methodology || undefined, methodologyVersion: finalProjectRow.methodology_version || undefined, stage: finalProjectRow.stage || undefined, country: finalProjectRow.country || undefined, vvb: finalProjectRow.vvb || undefined, notes: String(finalProjectRow.notes || ""), salesStatus: finalProjectRow.sales_status || "NEW", assignedOwner: finalProjectRow.assigned_owner || undefined, nextAction: finalProjectRow.next_action || undefined, nextActionDate: finalProjectRow.next_action_date ? iso(finalProjectRow.next_action_date) : undefined, documents: [], role: normalizeSalesProjectOrganizationRole(input.role), contacts: [], duplicate };
}

export async function deleteSalesProject(organizationId: string, projectId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const linked = await client.query(
      "SELECT 1 FROM sales_organization_projects WHERE organization_id = $1 AND project_id = $2 FOR UPDATE",
      [organizationId, projectId]
    );
    if (!linked.rows[0]) throw new Error("Project not found for this organization.");

    // Keep relationship history and contacts, but remove references that cannot
    // survive the project deletion. Explicit ordering also works on older schemas
    // before all project foreign keys were declared with ON DELETE CASCADE.
    await client.query("UPDATE sales_interactions SET project_id = NULL WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM sales_project_documents WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM sales_project_contacts WHERE project_id = $1", [projectId]);
    await client.query("DELETE FROM sales_organization_projects WHERE project_id = $1", [projectId]);
    const deleted = await client.query("DELETE FROM sales_projects WHERE id = $1 RETURNING id", [projectId]);
    if (!deleted.rows[0]) throw new Error("Project not found.");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSalesProject(input: { organizationId: string; projectId: string; name: string; vcsId?: string; methodology?: string; methodologyVersion?: string; stage?: string; country?: string; vvb?: string; role?: string; notes?: string; salesStatus?: SalesOrganizationStatus; assignedOwner?: string; nextAction?: string; nextActionDate?: string }): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const linked = await client.query(
      "SELECT 1 FROM sales_organization_projects WHERE organization_id=$1 AND project_id=$2",
      [input.organizationId, input.projectId]
    );
    if (!linked.rows[0]) throw new Error("Project not found for this organization.");
    const vcsId = normalizeSalesVcsId(input.vcsId) || null;
    await client.query(
      `UPDATE sales_projects
       SET vcs_id=$2, name=$3, methodology=$4, methodology_version=$5, stage=$6, country=$7, vvb=$8, sales_status=$9, assigned_owner=$10, next_action=$11, next_action_date=$12, notes=$13, updated_at=$14
       WHERE id=$1`,
      [input.projectId, vcsId, canonicalSalesProjectName(vcsId || undefined, input.name), input.methodology?.trim() || null, input.methodologyVersion?.trim() || null, input.stage?.trim() || null, input.country?.trim() || null, input.vvb?.trim() || null, input.salesStatus || "NEW", input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), input.notes?.trim() || "", new Date().toISOString()]
    );
    await client.query(
      "UPDATE sales_organization_projects SET role=$3 WHERE organization_id=$1 AND project_id=$2",
      [input.organizationId, input.projectId, normalizeSalesProjectOrganizationRole(input.role)]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function addSalesProjectContact(input: { organizationId: string; projectId: string; contactId: string; role?: string }): Promise<void> {
  const result = await getPool().query(
    `INSERT INTO sales_project_contacts (id, project_id, contact_id, role, created_at, updated_at)
     SELECT $1, $2, c.id, $4, $5, $5
     FROM sales_contacts c
     JOIN sales_organization_projects op ON op.organization_id = c.organization_id AND op.project_id = $2
     WHERE c.id = $3
     ON CONFLICT (project_id, contact_id) DO UPDATE SET role = EXCLUDED.role, updated_at = EXCLUDED.updated_at`,
    [randomUUID(), input.projectId, input.contactId, input.role?.trim() || "OTHER", new Date().toISOString()]
  );
  if (!result.rowCount) throw new Error("Contact is not associated with this project’s organization.");
}

export async function deleteSalesProjectContact(input: { organizationId: string; projectId: string; contactId: string }): Promise<void> {
  const result = await getPool().query(
    `DELETE FROM sales_project_contacts pc
     USING sales_organization_projects op
     WHERE pc.project_id = op.project_id AND op.organization_id = $1 AND pc.project_id = $2 AND pc.contact_id = $3
     RETURNING pc.id`,
    [input.organizationId, input.projectId, input.contactId]
  );
  if (!result.rowCount) throw new Error("Project contact not found for this organization.");
}

export async function updateSalesProjectWorkflow(input: { organizationId: string; projectId: string; salesStatus: SalesOrganizationStatus; assignedOwner?: string; nextAction?: string; nextActionDate?: string }): Promise<void> {
  const result = await getPool().query(
    "UPDATE sales_projects p SET sales_status=$3, assigned_owner=$4, next_action=$5, next_action_date=$6, updated_at=$7 FROM sales_organization_projects op WHERE p.id=$1 AND op.project_id=p.id AND op.organization_id=$2",
    [input.projectId, input.organizationId, input.salesStatus, input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), new Date().toISOString()]
  );
  if (!result.rowCount) throw new Error("Project not found for this organization.");
}

export async function createSalesTenderOpportunity(input: { organizationId: string; contactId?: string; name: string; buyer?: string; referenceNumber?: string; submissionDeadline?: string; contractValue?: string; sector?: string; status?: SalesTenderStatus; bidderStatus?: string; notes?: string; documentsRequested?: number; documentsReceived?: number; buyerRequirements?: string; salesStatus?: SalesOrganizationStatus; assignedOwner?: string; nextAction?: string; nextActionDate?: string; sourceKey?: string }): Promise<string> {
  const now = new Date().toISOString();
  const sourceKey = input.sourceKey?.trim() || null;
  const duplicate = sourceKey
    ? await getPool().query("SELECT id FROM sales_tender_opportunities WHERE organization_id = $1 AND source_key = $2 LIMIT 1", [input.organizationId, sourceKey])
    : input.referenceNumber?.trim()
      ? await getPool().query("SELECT id FROM sales_tender_opportunities WHERE organization_id = $1 AND reference_number = $2 LIMIT 1", [input.organizationId, input.referenceNumber.trim()])
      : await getPool().query("SELECT id FROM sales_tender_opportunities WHERE organization_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) AND LOWER(TRIM(COALESCE(buyer, ''))) = LOWER(TRIM(COALESCE($3, ''))) AND submission_deadline IS NOT DISTINCT FROM $4::timestamptz LIMIT 1", [input.organizationId, input.name, input.buyer || null, input.submissionDeadline || null]);
  if (duplicate.rows[0]) return String(duplicate.rows[0].id);
  const result = await getPool().query(
    `INSERT INTO sales_tender_opportunities (id, organization_id, contact_id, name, buyer, reference_number, submission_deadline, contract_value, sector, status, bidder_status, notes, documents_requested, documents_received, buyer_requirements, sales_status, assigned_owner, next_action, next_action_date, source_key, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21) RETURNING id`,
    [randomUUID(), input.organizationId, input.contactId || null, input.name.trim(), input.buyer?.trim() || null, input.referenceNumber?.trim() || null, input.submissionDeadline || null, input.contractValue?.trim() || null, input.sector?.trim() || null, input.status || "NEW", input.bidderStatus?.trim() || null, input.notes?.trim() || "", input.documentsRequested || 0, input.documentsReceived || 0, input.buyerRequirements?.trim() || "", input.salesStatus || "NEW", input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), sourceKey, now]
  );
  return String(result.rows[0].id);
}

export async function updateSalesTenderOpportunity(input: { id: string; organizationId: string; contactId?: string; name: string; buyer?: string; referenceNumber?: string; submissionDeadline?: string; contractValue?: string; sector?: string; status?: SalesTenderStatus; bidderStatus?: string; notes?: string; documentsRequested: number; documentsReceived: number; buyerRequirements?: string; salesStatus?: SalesOrganizationStatus; assignedOwner?: string; nextAction?: string; nextActionDate?: string }): Promise<void> {
  const bidderStatusProvided = input.bidderStatus !== undefined;
  const result = await getPool().query(
    `UPDATE sales_tender_opportunities SET contact_id=$3, name=$4, buyer=$5, reference_number=$6, submission_deadline=$7, contract_value=$8, sector=$9, status=COALESCE($10, status), notes=$11, documents_requested=$12, documents_received=$13, buyer_requirements=$14, sales_status=$15, assigned_owner=$16, next_action=$17, next_action_date=$18, bidder_status=CASE WHEN $19::boolean THEN $20 ELSE bidder_status END, updated_at=$21 WHERE id=$1 AND organization_id=$2`,
    [input.id, input.organizationId, input.contactId || null, input.name.trim(), input.buyer?.trim() || null, input.referenceNumber?.trim() || null, input.submissionDeadline || null, input.contractValue?.trim() || null, input.sector?.trim() || null, input.status, input.notes?.trim() || "", input.documentsRequested, input.documentsReceived, input.buyerRequirements?.trim() || "", input.salesStatus || "NEW", input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), bidderStatusProvided, input.bidderStatus?.trim() || null, new Date().toISOString()]
  );
  if (!result.rowCount) throw new Error("Tender opportunity not found for this organization.");
}

export async function addSalesTenderDocument(input: { organizationId: string; tenderOpportunityId: string; name: string; requested?: boolean; received?: boolean; notes?: string; sourceKey?: string }): Promise<void> {
  const now = new Date().toISOString();
  const sourceKey = input.sourceKey?.trim() || null;
  const duplicate = sourceKey
    ? await getPool().query("SELECT id FROM sales_tender_documents WHERE tender_opportunity_id = $1 AND source_key = $2 LIMIT 1", [input.tenderOpportunityId, sourceKey])
    : await getPool().query("SELECT id FROM sales_tender_documents WHERE tender_opportunity_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1", [input.tenderOpportunityId, input.name]);
  if (duplicate.rows[0]) return;
  const result = await getPool().query(
    `INSERT INTO sales_tender_documents (id, tender_opportunity_id, name, requested, received, received_at, notes, source_key, created_at, updated_at)
     SELECT $1,$2,$3,$4,$5,CASE WHEN $5 THEN $6::timestamptz ELSE NULL END,$7,$8,$6,$6
     WHERE EXISTS (SELECT 1 FROM sales_tender_opportunities WHERE id=$2 AND organization_id=$9)`,
    [randomUUID(), input.tenderOpportunityId, input.name.trim(), input.requested !== false, Boolean(input.received), now, input.notes?.trim() || "", sourceKey, input.organizationId]
  );
  if (!result.rowCount) throw new Error("Tender opportunity not found for this organization.");
  await getPool().query(
    `UPDATE sales_tender_opportunities t SET documents_requested = counts.requested, documents_received = counts.received, updated_at = $3
     FROM (SELECT COUNT(*) FILTER (WHERE requested)::int AS requested, COUNT(*) FILTER (WHERE received)::int AS received FROM sales_tender_documents WHERE tender_opportunity_id = $1) counts
     WHERE t.id = $1 AND t.organization_id = $2`,
    [input.tenderOpportunityId, input.organizationId, now]
  );
}

export async function updateSalesTenderDocument(input: { organizationId: string; id: string; name: string; requested: boolean; received: boolean; notes?: string }): Promise<void> {
  const result = await getPool().query(
    `UPDATE sales_tender_documents d SET name=$3, requested=$4, received=$5, received_at=CASE WHEN $5 THEN COALESCE(d.received_at, $6::timestamptz) ELSE NULL END, notes=$7, updated_at=$6
     FROM sales_tender_opportunities t WHERE d.id=$1 AND d.tender_opportunity_id=t.id AND t.organization_id=$2`,
    [input.id, input.organizationId, input.name.trim(), input.requested, input.received, new Date().toISOString(), input.notes?.trim() || ""]
  );
  if (!result.rowCount) throw new Error("Tender document not found for this organization.");
  await getPool().query(
    `UPDATE sales_tender_opportunities t SET documents_requested = (SELECT COUNT(*) FILTER (WHERE requested)::int FROM sales_tender_documents WHERE tender_opportunity_id = t.id), documents_received = (SELECT COUNT(*) FILTER (WHERE received)::int FROM sales_tender_documents WHERE tender_opportunity_id = t.id), updated_at = $3
     WHERE t.id = (SELECT tender_opportunity_id FROM sales_tender_documents WHERE id = $1) AND t.organization_id = $2`,
    [input.id, input.organizationId, new Date().toISOString()]
  );
}

export async function addSalesInteraction(input: { organizationId: string; contactId?: string; projectId?: string; tenderOpportunityId?: string; channel: string; direction: string; interactionType: string; occurredAt: string; subject?: string; summary: string; outcomeCode?: string; externalReference?: string; gmailThreadId?: string }): Promise<void> {
  const createdAt = new Date().toISOString();
  const occurredAt = normalizeSalesInteractionTimestamp(input.occurredAt);
  if (input.projectId) {
    const linked = await getPool().query(
      "SELECT 1 FROM sales_organization_projects WHERE organization_id = $1 AND project_id = $2 LIMIT 1",
      [input.organizationId, input.projectId]
    );
    if (!linked.rows[0]) throw new Error("Project is not linked to this organization.");
  }
  if (input.projectId && input.direction === "OUTBOUND") {
    const blocked = await getPool().query(
      `SELECT COALESCE(BOOL_AND(o.do_not_contact OR o.status = 'DO_NOT_CONTACT') FILTER (WHERE o.status <> 'CLOSED_NO'), FALSE) AS blocked
       FROM sales_organization_projects op
       JOIN sales_organizations o ON o.id = op.organization_id
       WHERE op.project_id = $1`, [input.projectId]
    );
    if (blocked.rows[0]?.blocked) throw new Error("Outbound outreach is blocked because all live stakeholders are marked do not contact.");
  }
  const hasThreadColumn = await hasGmailThreadColumn();
  const values = [randomUUID(), input.organizationId, input.contactId || null, input.projectId || null, input.tenderOpportunityId || null, input.channel, input.direction, input.interactionType, occurredAt, input.subject?.trim() || null, input.summary.trim(), input.outcomeCode?.trim() || null, input.externalReference?.trim() || null];
  if (hasThreadColumn) {
    await getPool().query(
      `INSERT INTO sales_interactions (id, organization_id, contact_id, project_id, tender_opportunity_id, channel, direction, interaction_type, occurred_at, subject, summary, outcome_code, external_reference, gmail_thread_id, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [...values, input.gmailThreadId?.trim() || null, createdAt]
    );
  } else {
    await getPool().query(
      `INSERT INTO sales_interactions (id, organization_id, contact_id, project_id, tender_opportunity_id, channel, direction, interaction_type, occurred_at, subject, summary, outcome_code, external_reference, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [...values, createdAt]
    );
  }
  await getPool().query("UPDATE sales_organizations SET updated_at = $2 WHERE id = $1", [input.organizationId, createdAt]);
}

export async function deleteSalesInteraction(organizationId: string, interactionId: string): Promise<void> {
  const result = await getPool().query(
    "DELETE FROM sales_interactions WHERE id = $1 AND organization_id = $2 RETURNING id",
    [interactionId, organizationId]
  );
  if (!result.rows[0]) throw new Error("Interaction not found for this organization.");
}

export async function updateSalesOrganizationState(input: { organizationId: string; status: SalesOrganizationStatus; experiment?: SalesExperiment; objectionCode?: SalesObjectionCode; internalCertificationTeam?: boolean; doNotContact?: boolean; notes?: string; assignedOwner?: string; nextAction?: string; nextActionDate?: string }): Promise<void> {
  await getPool().query(
    `UPDATE sales_organizations SET status=$2, experiment=$3, objection_code=$4, internal_certification_team=$5, do_not_contact=$6, notes=$7, assigned_owner=$8, next_action=$9, next_action_date=$10, updated_at=$11 WHERE id=$1`,
    [input.organizationId, input.status, input.experiment || "ARTICLE6_CARBON", input.objectionCode || null, input.internalCertificationTeam ?? null, Boolean(input.doNotContact), input.notes?.trim() || "", input.assignedOwner?.trim() || null, input.nextAction?.trim() || null, normalizeSalesDateTime(input.nextActionDate), new Date().toISOString()]
  );
}

export async function getSalesOrganizationDetail(id: string): Promise<SalesOrganizationDetail | null> {
  const organizationResult = await getPool().query("SELECT * FROM sales_organizations WHERE id = $1 LIMIT 1", [id]);
  if (!organizationResult.rows[0]) return null;
  const hasThreadColumn = await hasGmailThreadColumn();
  const threadSelect = hasThreadColumn ? "i.gmail_thread_id" : "NULL::text AS gmail_thread_id";
  const [contactsResult, projectsResult, tendersResult, interactionsResult, projectContactsResult] = await Promise.all([
    getPool().query("SELECT * FROM sales_contacts WHERE organization_id = $1 ORDER BY name ASC", [id]),
    getPool().query(`SELECT p.*, op.role,
         rollup.stakeholder_count, rollup.stakeholder_names, rollup.rolled_up_status, rollup.blocked
       FROM sales_organization_projects op
       JOIN sales_projects p ON p.id = op.project_id
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS stakeholder_count, ARRAY_AGG(o.name ORDER BY o.name) AS stakeholder_names,
           CASE WHEN BOOL_AND(o.do_not_contact OR o.status = 'DO_NOT_CONTACT') FILTER (WHERE o.status <> 'CLOSED_NO') THEN 'DO_NOT_CONTACT'
                ELSE (ARRAY_AGG(o.status ORDER BY CASE o.status WHEN 'CLOSED_WON' THEN 50 WHEN 'OPPORTUNITY' THEN 40 WHEN 'ENGAGED' THEN 30 WHEN 'NURTURE' THEN 20 WHEN 'CONTACTED' THEN 10 ELSE 0 END DESC) FILTER (WHERE o.status <> 'CLOSED_NO'))[1]
           END AS rolled_up_status,
           COALESCE(BOOL_AND(o.do_not_contact OR o.status = 'DO_NOT_CONTACT') FILTER (WHERE o.status <> 'CLOSED_NO'), FALSE) AS blocked
         FROM sales_organization_projects all_op
         JOIN sales_organizations o ON o.id = all_op.organization_id
         WHERE all_op.project_id = p.id
       ) rollup ON TRUE
       WHERE op.organization_id = $1 ORDER BY p.name ASC`, [id]),
    getPool().query("SELECT t.*, c.name AS contact_name FROM sales_tender_opportunities t LEFT JOIN sales_contacts c ON c.id = t.contact_id WHERE t.organization_id = $1 ORDER BY t.submission_deadline ASC NULLS LAST, t.name ASC", [id]),
    getPool().query(`SELECT i.*, c.name AS contact_name, p.name AS project_name, ${threadSelect} FROM sales_interactions i LEFT JOIN sales_contacts c ON c.id = i.contact_id LEFT JOIN sales_projects p ON p.id = i.project_id WHERE i.organization_id = $1 ORDER BY i.occurred_at ASC, i.created_at ASC`, [id]),
    getPool().query(`SELECT pc.*, c.name AS contact_name, c.title AS contact_title, c.organization_id, o.name AS organization_name
      FROM sales_project_contacts pc
      JOIN sales_contacts c ON c.id = pc.contact_id
      JOIN sales_organizations o ON o.id = c.organization_id
      JOIN sales_organization_projects op ON op.project_id = pc.project_id AND op.organization_id = $1
      WHERE pc.project_id = op.project_id
      ORDER BY c.name ASC`, [id]),
  ]);
  const tenderIds = tendersResult.rows.map((row) => String(row.id));
  const documentsResult = tenderIds.length ? await getPool().query("SELECT * FROM sales_tender_documents WHERE tender_opportunity_id = ANY($1::uuid[]) ORDER BY name ASC", [tenderIds]) : { rows: [] as QueryResultRow[] };
  const documentsByTender = new Map<string, SalesTenderDocument[]>();
  for (const row of documentsResult.rows) {
    const document = { id: String(row.id), tenderOpportunityId: String(row.tender_opportunity_id), name: String(row.name), requested: Boolean(row.requested), received: Boolean(row.received), receivedAt: row.received_at ? iso(row.received_at) : undefined, notes: String(row.notes || "") };
    documentsByTender.set(document.tenderOpportunityId, [...(documentsByTender.get(document.tenderOpportunityId) || []), document]);
  }
  const projectIds = projectsResult.rows.map((row) => String(row.id));
  const projectDocumentsResult = projectIds.length ? await getPool().query("SELECT * FROM sales_project_documents WHERE project_id = ANY($1::uuid[]) ORDER BY name ASC", [projectIds]) : { rows: [] as QueryResultRow[] };
  const projectDocumentsByProject = new Map<string, SalesProjectDocument[]>();
  for (const row of projectDocumentsResult.rows) {
    const document = { id: String(row.id), projectId: String(row.project_id), name: String(row.name), documentType: String(row.document_type), requested: Boolean(row.requested), received: Boolean(row.received), receivedAt: row.received_at ? iso(row.received_at) : undefined, notes: String(row.notes || "") };
    projectDocumentsByProject.set(document.projectId, [...(projectDocumentsByProject.get(document.projectId) || []), document]);
  }
  const projectContactsByProject = new Map<string, SalesProjectContact[]>();
  for (const row of projectContactsResult.rows) {
    const contact = { id: String(row.id), projectId: String(row.project_id), contactId: String(row.contact_id), contactName: String(row.contact_name), contactTitle: row.contact_title || undefined, organizationId: String(row.organization_id), organizationName: String(row.organization_name), role: String(row.role || "OTHER") };
    projectContactsByProject.set(contact.projectId, [...(projectContactsByProject.get(contact.projectId) || []), contact]);
  }
  const interactions = interactionsResult.rows.map((row) => ({ id: String(row.id), organizationId: String(row.organization_id), contactId: row.contact_id || undefined, projectId: row.project_id || undefined, tenderOpportunityId: row.tender_opportunity_id || undefined, contactName: row.contact_name || undefined, projectName: row.project_name || undefined, channel: String(row.channel), direction: String(row.direction), interactionType: String(row.interaction_type), occurredAt: iso(row.occurred_at || row.created_at), subject: row.subject || undefined, summary: String(row.summary), outcomeCode: row.outcome_code || undefined, externalReference: row.external_reference || undefined, gmailThreadId: row.gmail_thread_id || undefined }));
  return {
    organization: toOrganization(organizationResult.rows[0]),
    contacts: contactsResult.rows.map((row) => ({ id: String(row.id), organizationId: String(row.organization_id), name: String(row.name), title: row.title || undefined, email: row.email || undefined, phone: row.phone || undefined, status: String(row.status), notes: String(row.notes || "") })),
    projects: projectsResult.rows.map((row) => ({ id: String(row.id), vcsId: row.vcs_id || undefined, name: String(row.name), methodology: row.methodology || undefined, methodologyVersion: row.methodology_version || undefined, stage: row.stage || undefined, country: row.country || undefined, vvb: row.vvb || undefined, notes: String(row.notes || ""), role: String(row.role), salesStatus: row.sales_status as SalesOrganizationStatus, assignedOwner: row.assigned_owner || undefined, nextAction: row.next_action || undefined, nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined, documents: projectDocumentsByProject.get(String(row.id)) || [], contacts: projectContactsByProject.get(String(row.id)) || [], stakeholderCount: Number(row.stakeholder_count || 0), stakeholderNames: Array.isArray(row.stakeholder_names) ? row.stakeholder_names.map(String) : undefined, rolledUpStatus: row.rolled_up_status || undefined, blocked: Boolean(row.blocked) })),
    tenderOpportunities: tendersResult.rows.map((row) => ({ id: String(row.id), organizationId: String(row.organization_id), contactId: row.contact_id || undefined, contactName: row.contact_name || undefined, name: String(row.name), buyer: row.buyer || undefined, referenceNumber: row.reference_number || undefined, submissionDeadline: row.submission_deadline ? iso(row.submission_deadline) : undefined, contractValue: row.contract_value == null ? undefined : Number(row.contract_value), sector: row.sector || undefined, status: row.status as SalesTenderStatus, bidderStatus: row.bidder_status || undefined, notes: String(row.notes || ""), buyerRequirements: String(row.buyer_requirements || ""), salesStatus: row.sales_status as SalesOrganizationStatus, assignedOwner: row.assigned_owner || undefined, nextAction: row.next_action || undefined, nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined, documentsRequested: Number(row.documents_requested || 0), documentsReceived: Number(row.documents_received || 0), documents: documentsByTender.get(String(row.id)) || [], interactions: interactions.filter((interaction) => interaction.tenderOpportunityId === String(row.id)) })),
    interactions,
  };
}

export async function getSalesTenderOpportunity(id: string): Promise<{ tender: SalesTenderOpportunity; organization: SalesOrganization; contacts: SalesContact[] } | null> {
  const result = await getPool().query("SELECT organization_id FROM sales_tender_opportunities WHERE id = $1 LIMIT 1", [id]);
  if (!result.rows[0]) return null;
  const detail = await getSalesOrganizationDetail(String(result.rows[0].organization_id));
  const tender = detail?.tenderOpportunities.find((value) => value.id === id);
  return detail && tender ? { tender, organization: detail.organization, contacts: detail.contacts } : null;
}
