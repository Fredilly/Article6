import { randomUUID } from "crypto";
import { Pool, type QueryResultRow } from "pg";
import {
  normalizeDomain,
  normalizeOrganizationName,
  type SalesExperiment,
  type SalesObjectionCode,
  type SalesOrganizationStatus,
} from "./sales-memory";

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
  role?: string;
}

export interface SalesInteraction {
  id: string;
  organizationId: string;
  contactId?: string;
  projectId?: string;
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
}

export interface SalesOrganizationDetail {
  organization: SalesOrganization;
  contacts: SalesContact[];
  projects: SalesProject[];
  interactions: SalesInteraction[];
}

let pool: Pool | undefined;
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
  const result = await getPool().query(
    `INSERT INTO sales_contacts (id, organization_id, name, title, email, phone, status, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$8) RETURNING *`,
    [randomUUID(), input.organizationId, input.name.trim(), input.title?.trim() || null, email, input.phone?.trim() || null, input.notes?.trim() || "", now]
  );
  const row = result.rows[0];
  return { id: String(row.id), organizationId: String(row.organization_id), name: String(row.name), title: row.title || undefined, email: row.email || undefined, phone: row.phone || undefined, status: String(row.status), notes: String(row.notes || "") };
}

export async function addSalesProject(input: { organizationId: string; vcsId?: string; name: string; methodology?: string; methodologyVersion?: string; stage?: string; country?: string; vvb?: string; role?: string; notes?: string }): Promise<SalesProject> {
  const now = new Date().toISOString();
  const vcsId = input.vcsId?.trim() || null;
  let projectRow: QueryResultRow | undefined;
  if (vcsId) {
    projectRow = (await getPool().query("SELECT * FROM sales_projects WHERE vcs_id = $1 LIMIT 1", [vcsId])).rows[0];
  }
  if (!projectRow) {
    projectRow = (await getPool().query(
      `INSERT INTO sales_projects (id, vcs_id, name, methodology, methodology_version, stage, country, vvb, notes, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,
      [randomUUID(), vcsId, input.name.trim(), input.methodology?.trim() || null, input.methodologyVersion?.trim() || null, input.stage?.trim() || null, input.country?.trim() || null, input.vvb?.trim() || null, input.notes?.trim() || "", now]
    )).rows[0];
  }
  if (!projectRow) throw new Error("Project could not be created or resolved.");
  await getPool().query(
    `INSERT INTO sales_organization_projects (organization_id, project_id, role, created_at)
     VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id, project_id) DO UPDATE SET role = EXCLUDED.role`,
    [input.organizationId, projectRow.id, input.role?.trim() || "OTHER", now]
  );
  return { id: String(projectRow.id), vcsId: projectRow.vcs_id || undefined, name: String(projectRow.name), methodology: projectRow.methodology || undefined, methodologyVersion: projectRow.methodology_version || undefined, stage: projectRow.stage || undefined, country: projectRow.country || undefined, vvb: projectRow.vvb || undefined, notes: String(projectRow.notes || ""), role: input.role?.trim() || "OTHER" };
}

export async function addSalesInteraction(input: { organizationId: string; contactId?: string; projectId?: string; channel: string; direction: string; interactionType: string; occurredAt: string; subject?: string; summary: string; outcomeCode?: string; externalReference?: string }): Promise<void> {
  const createdAt = new Date().toISOString();
  await getPool().query(
    `INSERT INTO sales_interactions (id, organization_id, contact_id, project_id, channel, direction, interaction_type, occurred_at, subject, summary, outcome_code, external_reference, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [randomUUID(), input.organizationId, input.contactId || null, input.projectId || null, input.channel, input.direction, input.interactionType, input.occurredAt, input.subject?.trim() || null, input.summary.trim(), input.outcomeCode?.trim() || null, input.externalReference?.trim() || null, createdAt]
  );
  await getPool().query("UPDATE sales_organizations SET updated_at = $2 WHERE id = $1", [input.organizationId, createdAt]);
}

export async function updateSalesOrganizationState(input: { organizationId: string; status: SalesOrganizationStatus; experiment?: SalesExperiment; objectionCode?: SalesObjectionCode; internalCertificationTeam?: boolean; doNotContact?: boolean; notes?: string }): Promise<void> {
  await getPool().query(
    `UPDATE sales_organizations SET status=$2, experiment=$3, objection_code=$4, internal_certification_team=$5, do_not_contact=$6, notes=$7, updated_at=$8 WHERE id=$1`,
    [input.organizationId, input.status, input.experiment || "ARTICLE6_CARBON", input.objectionCode || null, input.internalCertificationTeam ?? null, Boolean(input.doNotContact), input.notes?.trim() || "", new Date().toISOString()]
  );
}

export async function getSalesOrganizationDetail(id: string): Promise<SalesOrganizationDetail | null> {
  const organizationResult = await getPool().query("SELECT * FROM sales_organizations WHERE id = $1 LIMIT 1", [id]);
  if (!organizationResult.rows[0]) return null;
  const [contactsResult, projectsResult, interactionsResult] = await Promise.all([
    getPool().query("SELECT * FROM sales_contacts WHERE organization_id = $1 ORDER BY name ASC", [id]),
    getPool().query(`SELECT p.*, op.role FROM sales_organization_projects op JOIN sales_projects p ON p.id = op.project_id WHERE op.organization_id = $1 ORDER BY p.name ASC`, [id]),
    getPool().query(`SELECT i.*, c.name AS contact_name, p.name AS project_name FROM sales_interactions i LEFT JOIN sales_contacts c ON c.id = i.contact_id LEFT JOIN sales_projects p ON p.id = i.project_id WHERE i.organization_id = $1 ORDER BY i.occurred_at DESC, i.created_at DESC`, [id]),
  ]);
  return {
    organization: toOrganization(organizationResult.rows[0]),
    contacts: contactsResult.rows.map((row) => ({ id: String(row.id), organizationId: String(row.organization_id), name: String(row.name), title: row.title || undefined, email: row.email || undefined, phone: row.phone || undefined, status: String(row.status), notes: String(row.notes || "") })),
    projects: projectsResult.rows.map((row) => ({ id: String(row.id), vcsId: row.vcs_id || undefined, name: String(row.name), methodology: row.methodology || undefined, methodologyVersion: row.methodology_version || undefined, stage: row.stage || undefined, country: row.country || undefined, vvb: row.vvb || undefined, notes: String(row.notes || ""), role: String(row.role) })),
    interactions: interactionsResult.rows.map((row) => ({ id: String(row.id), organizationId: String(row.organization_id), contactId: row.contact_id || undefined, projectId: row.project_id || undefined, contactName: row.contact_name || undefined, projectName: row.project_name || undefined, channel: String(row.channel), direction: String(row.direction), interactionType: String(row.interaction_type), occurredAt: iso(row.occurred_at), subject: row.subject || undefined, summary: String(row.summary), outcomeCode: row.outcome_code || undefined, externalReference: row.external_reference || undefined })),
  };
}
