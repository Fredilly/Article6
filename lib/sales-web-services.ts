import { Pool, type QueryResultRow } from "pg";

export const WEB_SERVICE_PRIMARY_SERVICES = ["GEO_VISIBILITY", "WEBSITE_REDESIGN", "BOTH", "UNKNOWN"] as const;
export const WEB_SERVICE_PROBLEM_STATUSES = ["UNKNOWN", "YES", "NO"] as const;
export const WHATSAPP_STATUSES = ["VERIFIED", "LIKELY", "UNKNOWN", "NO"] as const;
export type WebServicePrimaryService = (typeof WEB_SERVICE_PRIMARY_SERVICES)[number];
export type WebServiceProblemStatus = (typeof WEB_SERVICE_PROBLEM_STATUSES)[number];
export type WhatsAppStatus = (typeof WHATSAPP_STATUSES)[number];

export interface SalesWebServiceProfile {
  organizationId: string;
  websiteUrl?: string;
  serviceHypotheses: string[];
  aiQueryTested?: string;
  targetAppearing?: boolean;
  competitorsAppearing: string[];
  websiteObservation?: string;
  lastVerifiedAt?: string;
  primaryService: WebServicePrimaryService;
  commercialValue?: number;
  problemConfirmed: WebServiceProblemStatus;
  priceDiscussed: boolean;
  caseStudySent: boolean;
  nextAction?: string;
  nextActionDate?: string;
}

export interface SalesWebServiceProfilePatch {
  websiteUrl?: string | null;
  serviceHypotheses?: string[];
  aiQueryTested?: string | null;
  targetAppearing?: boolean | null;
  competitorsAppearing?: string[];
  websiteObservation?: string | null;
  lastVerifiedAt?: string | null;
  primaryService?: WebServicePrimaryService;
  commercialValue?: number | null;
  problemConfirmed?: WebServiceProblemStatus;
  priceDiscussed?: boolean;
  caseStudySent?: boolean;
  nextAction?: string | null;
  nextActionDate?: string | null;
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

function optionalText(value: unknown): string | undefined {
  return value == null || value === "" ? undefined : String(value);
}

function array(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function toProfile(row: QueryResultRow): SalesWebServiceProfile {
  return {
    organizationId: String(row.organization_id),
    websiteUrl: optionalText(row.website_url),
    serviceHypotheses: array(row.service_hypotheses),
    aiQueryTested: optionalText(row.ai_query_tested),
    targetAppearing: row.target_appearing == null ? undefined : Boolean(row.target_appearing),
    competitorsAppearing: array(row.competitors_appearing),
    websiteObservation: optionalText(row.website_observation),
    lastVerifiedAt: row.last_verified_at ? iso(row.last_verified_at) : undefined,
    primaryService: (row.primary_service || "UNKNOWN") as WebServicePrimaryService,
    commercialValue: row.commercial_value == null ? undefined : Number(row.commercial_value),
    problemConfirmed: (row.problem_confirmed || "UNKNOWN") as WebServiceProblemStatus,
    priceDiscussed: Boolean(row.price_discussed),
    caseStudySent: Boolean(row.case_study_sent),
    nextAction: optionalText(row.next_action),
    nextActionDate: row.next_action_date ? iso(row.next_action_date) : undefined,
  };
}

export async function getSalesWebServiceProfile(organizationId: string): Promise<SalesWebServiceProfile | null> {
  const result = await getPool().query("SELECT * FROM sales_web_service_profiles WHERE organization_id = $1", [organizationId]);
  return result.rows[0] ? toProfile(result.rows[0]) : null;
}

export async function getSalesWebServiceWhatsAppStatuses(organizationId: string): Promise<Record<string, WhatsAppStatus>> {
  const result = await getPool().query(
    "SELECT id, whatsapp_status FROM sales_contacts WHERE organization_id = $1 ORDER BY name ASC",
    [organizationId],
  );
  return Object.fromEntries(result.rows.map((row) => [String(row.id), (row.whatsapp_status || "UNKNOWN") as WhatsAppStatus]));
}

function validatePatch(patch: SalesWebServiceProfilePatch) {
  if (patch.serviceHypotheses && patch.serviceHypotheses.some((value) => !["GEO_VISIBILITY", "WEBSITE_REDESIGN"].includes(value))) {
    throw new Error("Invalid Web Services potential service.");
  }
  if (patch.primaryService && !WEB_SERVICE_PRIMARY_SERVICES.includes(patch.primaryService)) throw new Error("Invalid primary service.");
  if (patch.problemConfirmed && !WEB_SERVICE_PROBLEM_STATUSES.includes(patch.problemConfirmed)) throw new Error("Invalid problem-confirmed value.");
  if (patch.lastVerifiedAt && Number.isNaN(Date.parse(patch.lastVerifiedAt))) throw new Error("Invalid last checked date.");
  if (patch.nextActionDate && Number.isNaN(Date.parse(patch.nextActionDate))) throw new Error("Invalid next action date.");
  if (patch.commercialValue != null && (!Number.isFinite(patch.commercialValue) || patch.commercialValue < 0)) throw new Error("Invalid commercial value.");
}

export async function upsertSalesWebServiceProfile(organizationId: string, patch: SalesWebServiceProfilePatch): Promise<SalesWebServiceProfile> {
  validatePatch(patch);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const organization = await client.query("SELECT experiment FROM sales_organizations WHERE id = $1", [organizationId]);
    if (!organization.rows[0]) throw new Error("Organization not found.");
    if (organization.rows[0].experiment !== "WEB_SERVICES") throw new Error("Web Services profile is only available for WEB_SERVICES organizations.");

    await client.query(
      `INSERT INTO sales_web_service_profiles (organization_id, created_at, updated_at)
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (organization_id) DO NOTHING`,
      [organizationId],
    );

    const columnMap: Record<keyof SalesWebServiceProfilePatch, string> = {
      websiteUrl: "website_url",
      serviceHypotheses: "service_hypotheses",
      aiQueryTested: "ai_query_tested",
      targetAppearing: "target_appearing",
      competitorsAppearing: "competitors_appearing",
      websiteObservation: "website_observation",
      lastVerifiedAt: "last_verified_at",
      primaryService: "primary_service",
      commercialValue: "commercial_value",
      problemConfirmed: "problem_confirmed",
      priceDiscussed: "price_discussed",
      caseStudySent: "case_study_sent",
      nextAction: "next_action",
      nextActionDate: "next_action_date",
    };
    const keys = (Object.keys(patch) as Array<keyof SalesWebServiceProfilePatch>).filter((key) => patch[key] !== undefined);
    if (keys.length) {
      const values: unknown[] = [organizationId];
      const assignments = keys.map((key, index) => {
        values.push(patch[key] ?? null);
        return `${columnMap[key]} = $${index + 2}`;
      });
      assignments.push("updated_at = CURRENT_TIMESTAMP");
      await client.query(`UPDATE sales_web_service_profiles SET ${assignments.join(", ")} WHERE organization_id = $1`, values);
    }

    const result = await client.query("SELECT * FROM sales_web_service_profiles WHERE organization_id = $1", [organizationId]);
    if (!result.rows[0]) throw new Error("Web Services profile could not be loaded after update.");
    await client.query("COMMIT");
    return toProfile(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateSalesContactWhatsAppStatus(input: { organizationId: string; contactId: string; whatsappStatus: WhatsAppStatus }): Promise<void> {
  if (!WHATSAPP_STATUSES.includes(input.whatsappStatus)) throw new Error("Invalid WhatsApp status.");
  const result = await getPool().query(
    `UPDATE sales_contacts c
     SET whatsapp_status = $3, updated_at = CURRENT_TIMESTAMP
     FROM sales_organizations o
     WHERE c.id = $1 AND c.organization_id = $2 AND o.id = c.organization_id AND o.experiment = 'WEB_SERVICES'
     RETURNING c.id`,
    [input.contactId, input.organizationId, input.whatsappStatus],
  );
  if (!result.rows[0]) throw new Error("Web Services contact not found.");
}
