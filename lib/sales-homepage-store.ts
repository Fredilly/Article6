import { Pool, type QueryResultRow } from "pg";
import {
  listSalesOrganizations,
  type SalesContact,
  type SalesOrganizationDetail,
  type SalesProject,
  type SalesTenderOpportunity,
  type SalesTenderStatus,
} from "./sales-store";
import type { SalesOrganizationStatus } from "./sales-memory";

let homepagePool: Pool | undefined;

function getHomepagePool(): Pool {
  if (homepagePool) return homepagePool;
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  homepagePool = new Pool({
    connectionString,
    max: 3,
    ...(process.env.NODE_ENV === "production"
      ? { ssl: { rejectUnauthorized: true } }
      : connectionString.includes("localhost")
        ? { ssl: false }
        : {}),
  });
  return homepagePool;
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

export async function loadSalesHomepageData(): Promise<{
  details: SalesOrganizationDetail[];
  tenderOpportunities: SalesTenderOpportunity[];
}> {
  const organizations = await listSalesOrganizations("");
  if (!organizations.length) return { details: [], tenderOpportunities: [] };

  const organizationIds = organizations.map((organization) => organization.id);
  const pool = getHomepagePool();
  const [contactsResult, projectsResult, tendersResult] = await Promise.all([
    pool.query(
      `SELECT *
       FROM sales_contacts
       WHERE organization_id = ANY($1::uuid[])
       ORDER BY organization_id, name ASC`,
      [organizationIds]
    ),
    pool.query(
      `SELECT p.*, op.organization_id, op.role,
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
       WHERE op.organization_id = ANY($1::uuid[])
       ORDER BY op.organization_id, p.name ASC`,
      [organizationIds]
    ),
    pool.query(
      `SELECT t.*, c.name AS contact_name
       FROM sales_tender_opportunities t
       LEFT JOIN sales_contacts c ON c.id = t.contact_id
       WHERE t.organization_id = ANY($1::uuid[])
       ORDER BY t.organization_id, t.submission_deadline ASC NULLS LAST, t.name ASC`,
      [organizationIds]
    ),
  ]);

  const contactsByOrganization = new Map<string, SalesContact[]>();
  for (const row of contactsResult.rows) {
    const contact: SalesContact = {
      id: String(row.id),
      organizationId: String(row.organization_id),
      name: String(row.name),
      title: row.title || undefined,
      email: row.email || undefined,
      phone: row.phone || undefined,
      status: String(row.status),
      notes: String(row.notes || ""),
    };
    contactsByOrganization.set(contact.organizationId, [...(contactsByOrganization.get(contact.organizationId) || []), contact]);
  }

  const projectsByOrganization = new Map<string, SalesProject[]>();
  for (const row of projectsResult.rows) {
    const organizationId = String(row.organization_id);
    const project: SalesProject = {
      id: String(row.id),
      vcsId: row.vcs_id || undefined,
      name: String(row.name),
      methodology: row.methodology || undefined,
      methodologyVersion: row.methodology_version || undefined,
      stage: row.stage || undefined,
      country: row.country || undefined,
      vvb: row.vvb || undefined,
      notes: String(row.notes || ""),
      role: String(row.role),
      salesStatus: row.sales_status as SalesOrganizationStatus,
      assignedOwner: row.assigned_owner || undefined,
      nextAction: row.next_action || undefined,
      nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined,
      documents: [],
      contacts: [],
      stakeholderCount: Number(row.stakeholder_count || 0),
      stakeholderNames: Array.isArray(row.stakeholder_names) ? row.stakeholder_names.map(String) : undefined,
      rolledUpStatus: row.rolled_up_status || undefined,
      blocked: Boolean(row.blocked),
    };
    projectsByOrganization.set(organizationId, [...(projectsByOrganization.get(organizationId) || []), project]);
  }

  const tenderOpportunities: SalesTenderOpportunity[] = tendersResult.rows.map((row: QueryResultRow) => ({
    id: String(row.id),
    organizationId: String(row.organization_id),
    contactId: row.contact_id || undefined,
    contactName: row.contact_name || undefined,
    name: String(row.name),
    buyer: row.buyer || undefined,
    referenceNumber: row.reference_number || undefined,
    submissionDeadline: row.submission_deadline ? iso(row.submission_deadline) : undefined,
    contractValue: row.contract_value == null ? undefined : Number(row.contract_value),
    sector: row.sector || undefined,
    status: row.status as SalesTenderStatus,
    notes: String(row.notes || ""),
    buyerRequirements: String(row.buyer_requirements || ""),
    salesStatus: row.sales_status as SalesOrganizationStatus,
    assignedOwner: row.assigned_owner || undefined,
    nextAction: row.next_action || undefined,
    nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined,
    documentsRequested: Number(row.documents_requested || 0),
    documentsReceived: Number(row.documents_received || 0),
    documents: [],
    interactions: [],
  }));

  const tendersByOrganization = new Map<string, SalesTenderOpportunity[]>();
  for (const tender of tenderOpportunities) {
    tendersByOrganization.set(tender.organizationId, [...(tendersByOrganization.get(tender.organizationId) || []), tender]);
  }

  const details: SalesOrganizationDetail[] = organizations.map((organization) => ({
    organization,
    contacts: contactsByOrganization.get(organization.id) || [],
    projects: projectsByOrganization.get(organization.id) || [],
    tenderOpportunities: tendersByOrganization.get(organization.id) || [],
    interactions: [],
  }));

  return { details, tenderOpportunities };
}
