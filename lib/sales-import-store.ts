import { randomUUID } from "crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { normalizeDomain, normalizeOrganizationName, isSalesObjectionCode, isSalesOrganizationStatus } from "./sales-memory";
import { normalizeSalesInteractionTimestamp } from "./sales-timestamps";

export interface SalesImportContact { name: string; title?: string; email?: string; phone?: string; notes?: string; }
export interface SalesImportProject { vcsId?: string; name: string; methodology?: string; methodologyVersion?: string; stage?: string; country?: string; vvb?: string; role?: string; notes?: string; }
export interface SalesImportInteraction { contactEmail?: string; projectVcsId?: string; channel?: string; direction?: string; interactionType?: string; gmailThreadId?: string; gmailTimestamp?: string | number; occurredAt: string; subject?: string; summary: string; outcomeCode?: string; externalReference?: string; }

export interface SalesImportCandidate {
  id: string;
  sourceType: string;
  sourceKey: string;
  organizationName: string;
  domain?: string;
  proposedStatus?: string;
  proposedObjection?: string;
  confidence?: number;
  contacts: SalesImportContact[];
  projects: SalesImportProject[];
  interactions: SalesImportInteraction[];
  evidenceSummary: string;
  matchedOrganizationId?: string;
  matchedOrganizationName?: string;
  state: string;
  createdAt: string;
  reviewedAt?: string;
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
    ...(process.env.NODE_ENV === "production" ? { ssl: { rejectUnauthorized: true } } : connectionString.includes("localhost") ? { ssl: false } : {}),
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

function toCandidate(row: QueryResultRow): SalesImportCandidate {
  return {
    id: String(row.id), sourceType: String(row.source_type), sourceKey: String(row.source_key), organizationName: String(row.organization_name),
    domain: row.domain || undefined, proposedStatus: row.proposed_status || undefined, proposedObjection: row.proposed_objection || undefined,
    confidence: row.confidence == null ? undefined : Number(row.confidence), contacts: Array.isArray(row.contacts_json) ? row.contacts_json : [],
    projects: Array.isArray(row.projects_json) ? row.projects_json : [], interactions: Array.isArray(row.interactions_json) ? row.interactions_json : [],
    evidenceSummary: String(row.evidence_summary || ""), matchedOrganizationId: row.matched_organization_id || undefined,
    matchedOrganizationName: row.matched_organization_name || undefined, state: String(row.state),
    createdAt: new Date(row.created_at).toISOString(), reviewedAt: row.reviewed_at ? new Date(row.reviewed_at).toISOString() : undefined,
  };
}

export async function listSalesImportCandidates(state = "PENDING"): Promise<SalesImportCandidate[]> {
  const result = await getPool().query(
    `SELECT c.*, o.name AS matched_organization_name
     FROM sales_import_candidates c
     LEFT JOIN sales_organizations o ON o.id = c.matched_organization_id
     WHERE c.state = $1
     ORDER BY c.confidence DESC NULLS LAST, c.created_at DESC`, [state]
  );
  return result.rows.map(toCandidate);
}

export async function createSalesImportCandidate(input: Omit<SalesImportCandidate, "id" | "state" | "createdAt" | "reviewedAt" | "matchedOrganizationName">): Promise<SalesImportCandidate> {
  const domain = normalizeDomain(input.domain || "");
  const normalizedName = normalizeOrganizationName(input.organizationName);
  const match = await getPool().query(
    `SELECT o.id FROM sales_organizations o
     WHERE o.normalized_name = $1 OR ($2::text IS NOT NULL AND o.domain = $2)
        OR EXISTS (SELECT 1 FROM sales_contacts sc WHERE sc.organization_id = o.id AND LOWER(sc.email) = ANY($3::text[]))
     LIMIT 1`,
    [normalizedName, domain, input.contacts.map((c) => c.email?.trim().toLowerCase()).filter(Boolean)]
  );
  const now = new Date().toISOString();
  const result = await getPool().query(
    `INSERT INTO sales_import_candidates
      (id, source_type, source_key, organization_name, domain, proposed_status, proposed_objection, confidence, contacts_json, projects_json, interactions_json, evidence_summary, matched_organization_id, state, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13,'PENDING',$14)
     ON CONFLICT (source_type, source_key) DO UPDATE SET
       organization_name=EXCLUDED.organization_name, domain=EXCLUDED.domain, proposed_status=EXCLUDED.proposed_status,
       proposed_objection=EXCLUDED.proposed_objection, confidence=EXCLUDED.confidence, contacts_json=EXCLUDED.contacts_json,
       projects_json=EXCLUDED.projects_json, interactions_json=EXCLUDED.interactions_json, evidence_summary=EXCLUDED.evidence_summary,
       matched_organization_id=EXCLUDED.matched_organization_id
     RETURNING *`,
    [randomUUID(), input.sourceType, input.sourceKey, input.organizationName.trim(), domain, input.proposedStatus || null, input.proposedObjection || null,
      input.confidence ?? null, JSON.stringify(input.contacts), JSON.stringify(input.projects), JSON.stringify(input.interactions), input.evidenceSummary || "", match.rows[0]?.id || input.matchedOrganizationId || null, now]
  );
  return toCandidate(result.rows[0]);
}

async function resolveOrganization(client: PoolClient, candidate: QueryResultRow, explicitOrganizationId?: string): Promise<string> {
  if (explicitOrganizationId) {
    const explicit = await client.query("SELECT id FROM sales_organizations WHERE id=$1", [explicitOrganizationId]);
    if (!explicit.rows[0]) throw new Error("Selected organization does not exist.");
    return String(explicit.rows[0].id);
  }
  if (candidate.matched_organization_id) return String(candidate.matched_organization_id);
  const domain = normalizeDomain(candidate.domain || "");
  const normalizedName = normalizeOrganizationName(String(candidate.organization_name));
  const existing = await client.query("SELECT id FROM sales_organizations WHERE normalized_name=$1 OR ($2::text IS NOT NULL AND domain=$2) LIMIT 1", [normalizedName, domain]);
  if (existing.rows[0]) return String(existing.rows[0].id);
  const id = randomUUID();
  const now = new Date().toISOString();
  await client.query(
    `INSERT INTO sales_organizations (id,name,normalized_name,domain,status,notes,do_not_contact,created_at,updated_at)
     VALUES ($1,$2,$3,$4,'NEW','',FALSE,$5,$5)`, [id, candidate.organization_name, normalizedName, domain, now]
  );
  return id;
}

export async function approveSalesImportCandidate(id: string, explicitOrganizationId?: string): Promise<string> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const hasThreadColumn = await hasGmailThreadColumn();
    const result = await client.query("SELECT * FROM sales_import_candidates WHERE id=$1 FOR UPDATE", [id]);
    const candidate = result.rows[0];
    if (!candidate) throw new Error("Import candidate not found.");
    if (candidate.state !== "PENDING") throw new Error("Import candidate has already been reviewed.");
    const organizationId = await resolveOrganization(client, candidate, explicitOrganizationId);
    const now = new Date().toISOString();
    const contactIds = new Map<string, string>();
    for (const contact of (candidate.contacts_json || []) as SalesImportContact[]) {
      const email = contact.email?.trim().toLowerCase() || null;
      let row = email ? (await client.query("SELECT * FROM sales_contacts WHERE LOWER(email)=$1 LIMIT 1", [email])).rows[0] : undefined;
      if (row && String(row.organization_id) !== organizationId) throw new Error(`Contact ${email} already belongs to another organization.`);
      if (!row) {
        const contactId = randomUUID();
        const inserted = await client.query(
          `INSERT INTO sales_contacts (id,organization_id,name,title,email,phone,status,notes,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE',$7,$8,$8) RETURNING *`,
          [contactId, organizationId, contact.name.trim(), contact.title?.trim() || null, email, contact.phone?.trim() || null, contact.notes?.trim() || "", now]
        );
        row = inserted.rows[0];
      }
      if (email) contactIds.set(email, String(row.id));
    }
    const projectIds = new Map<string, string>();
    for (const project of (candidate.projects_json || []) as SalesImportProject[]) {
      const vcsId = project.vcsId?.trim() || null;
      let row = vcsId ? (await client.query("SELECT * FROM sales_projects WHERE vcs_id=$1 LIMIT 1", [vcsId])).rows[0] : undefined;
      if (!row) {
        const projectId = randomUUID();
        row = (await client.query(
          `INSERT INTO sales_projects (id,vcs_id,name,methodology,methodology_version,stage,country,vvb,notes,created_at,updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,
          [projectId, vcsId, project.name.trim(), project.methodology?.trim() || null, project.methodologyVersion?.trim() || null, project.stage?.trim() || null,
            project.country?.trim() || null, project.vvb?.trim() || null, project.notes?.trim() || "", now]
        )).rows[0];
      }
      await client.query(
        `INSERT INTO sales_organization_projects (organization_id,project_id,role,created_at)
         VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id,project_id) DO UPDATE SET role=EXCLUDED.role`,
        [organizationId, row.id, project.role?.trim() || "OTHER", now]
      );
      if (vcsId) projectIds.set(vcsId, String(row.id));
    }
    for (const interaction of (candidate.interactions_json || []) as SalesImportInteraction[]) {
      const occurredAt = normalizeSalesInteractionTimestamp(interaction.gmailTimestamp ?? interaction.occurredAt);
      const values = [randomUUID(), organizationId, interaction.contactEmail ? contactIds.get(interaction.contactEmail.trim().toLowerCase()) || null : null,
        interaction.projectVcsId ? projectIds.get(interaction.projectVcsId.trim()) || null : null, interaction.channel || "EMAIL", interaction.direction || "INTERNAL",
        interaction.interactionType || "MESSAGE", occurredAt, interaction.subject?.trim() || null, interaction.summary.trim(), interaction.outcomeCode?.trim() || null,
        interaction.externalReference?.trim() || null];
      if (hasThreadColumn) {
        await client.query(
          `INSERT INTO sales_interactions (id,organization_id,contact_id,project_id,channel,direction,interaction_type,occurred_at,subject,summary,outcome_code,external_reference,gmail_thread_id,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`, [...values, interaction.gmailThreadId?.trim() || null, now]
        );
      } else {
        await client.query(
          `INSERT INTO sales_interactions (id,organization_id,contact_id,project_id,channel,direction,interaction_type,occurred_at,subject,summary,outcome_code,external_reference,created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`, [...values, now]
        );
      }
    }
    if (candidate.proposed_status && isSalesOrganizationStatus(candidate.proposed_status)) {
      const objection = candidate.proposed_objection && isSalesObjectionCode(candidate.proposed_objection) ? candidate.proposed_objection : null;
      await client.query("UPDATE sales_organizations SET status=$2, objection_code=$3, updated_at=$4 WHERE id=$1", [organizationId, candidate.proposed_status, objection, now]);
    } else {
      await client.query("UPDATE sales_organizations SET updated_at=$2 WHERE id=$1", [organizationId, now]);
    }
    await client.query("UPDATE sales_import_candidates SET state='APPROVED', matched_organization_id=$2, reviewed_at=$3 WHERE id=$1", [id, organizationId, now]);
    await client.query("COMMIT");
    return organizationId;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function ignoreSalesImportCandidate(id: string): Promise<void> {
  await getPool().query("UPDATE sales_import_candidates SET state='IGNORED', reviewed_at=$2 WHERE id=$1 AND state='PENDING'", [id, new Date().toISOString()]);
}
