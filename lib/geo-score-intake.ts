import { createHash, randomUUID } from "crypto";
import { Pool } from "pg";
import { normalizeOrganizationName } from "./sales-memory";

export type GeoScoreMainGoal =
  | "Improve AI visibility"
  | "Improve search discoverability"
  | "Understand website weaknesses"
  | "Website upgrade";

export interface GeoScoreLeadInput {
  name: string;
  email: string;
  company: string;
  websiteUrl: string;
  mainGoal: GeoScoreMainGoal;
  notes?: string;
  overallScore?: number | null;
  categoryScores?: Record<string, number | null>;
  topFindings?: Array<{ title: string; explanation?: string }>;
  analyzedAt?: string;
  scoringVersion?: string;
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

function domainFromWebsite(websiteUrl: string): string | null {
  try {
    return new URL(websiteUrl).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

function conciseObservation(input: GeoScoreLeadInput): string {
  const parts = [
    input.overallScore == null ? null : `Article6 GEO Diagnostic Score: ${input.overallScore}/100`,
    input.categoryScores
      ? Object.entries(input.categoryScores)
          .map(([name, value]) => `${name}: ${value == null ? "unavailable" : value}`)
          .join(" · ")
      : null,
    input.topFindings?.length
      ? `Top findings: ${input.topFindings.map((finding) => finding.title).join("; ")}`
      : null,
  ].filter(Boolean);

  return parts.join("\n").slice(0, 3000);
}

function retryKey(input: GeoScoreLeadInput): string {
  return createHash("sha256")
    .update([
      input.email.trim().toLowerCase(),
      input.websiteUrl.trim().toLowerCase(),
      input.analyzedAt || "",
      input.scoringVersion || "",
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export async function storeGeoScoreLead(input: GeoScoreLeadInput): Promise<{ created: boolean }> {
  const client = await getPool().connect();
  const now = new Date().toISOString();
  const email = input.email.trim().toLowerCase();
  const company = input.company.trim();
  const normalizedCompany = normalizeOrganizationName(company);
  const domain = domainFromWebsite(input.websiteUrl);
  const idempotencyKey = `geo-score:${retryKey(input)}`;
  const observation = conciseObservation(input);

  try {
    await client.query("BEGIN");

    const prior = await client.query(
      `SELECT id
       FROM sales_interactions
       WHERE external_reference = $1
       LIMIT 1`,
      [idempotencyKey],
    );

    if (prior.rows[0]) {
      await client.query("COMMIT");
      return { created: false };
    }

    const existingContact = await client.query(
      `SELECT c.id AS contact_id, c.organization_id, o.experiment
       FROM sales_contacts c
       JOIN sales_organizations o ON o.id = c.organization_id
       WHERE LOWER(c.email) = $1
       LIMIT 1`,
      [email],
    );

    let organizationId: string;
    let contactId: string;
    let organizationExperiment: string;

    if (existingContact.rows[0]) {
      organizationId = String(existingContact.rows[0].organization_id);
      contactId = String(existingContact.rows[0].contact_id);
      organizationExperiment = String(existingContact.rows[0].experiment || "OTHER");

      await client.query(
        `UPDATE sales_contacts
         SET name = $2, updated_at = $3
         WHERE id = $1`,
        [contactId, input.name.trim(), now],
      );

      await client.query(
        `UPDATE sales_organizations
         SET status = CASE WHEN status IN ('NEW','CONTACTED','NURTURE') THEN 'ENGAGED' ELSE status END,
             domain = COALESCE(domain, $2),
             updated_at = $3
         WHERE id = $1`,
        [organizationId, domain, now],
      );
    } else {
      const existingOrganization = await client.query(
        `SELECT id, experiment
         FROM sales_organizations
         WHERE normalized_name = $1
            OR ($2::text IS NOT NULL AND domain = $2)
         LIMIT 1`,
        [normalizedCompany, domain],
      );

      if (existingOrganization.rows[0]) {
        organizationId = String(existingOrganization.rows[0].id);
        organizationExperiment = String(existingOrganization.rows[0].experiment || "OTHER");

        await client.query(
          `UPDATE sales_organizations
           SET status = CASE WHEN status IN ('NEW','CONTACTED','NURTURE') THEN 'ENGAGED' ELSE status END,
               domain = COALESCE(domain, $2),
               updated_at = $3
           WHERE id = $1`,
          [organizationId, domain, now],
        );
      } else {
        organizationId = randomUUID();
        organizationExperiment = "WEB_SERVICES";

        await client.query(
          `INSERT INTO sales_organizations
            (id, name, normalized_name, domain, experiment, status, notes, do_not_contact, created_at, updated_at)
           VALUES ($1, $2, $3, $4, 'WEB_SERVICES', 'ENGAGED', $5, FALSE, $6, $6)`,
          [
            organizationId,
            company,
            normalizedCompany,
            domain,
            "Inbound qualified lead from Article6 Signal GEO Score.",
            now,
          ],
        );
      }

      contactId = randomUUID();
      await client.query(
        `INSERT INTO sales_contacts
          (id, organization_id, name, email, status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'ACTIVE', $5, $6, $6)`,
        [
          contactId,
          organizationId,
          input.name.trim(),
          email,
          "Inbound qualified lead from Article6 Signal GEO Score.",
          now,
        ],
      );
    }

    if (organizationExperiment === "WEB_SERVICES") {
      await client.query(
        `INSERT INTO sales_web_service_profiles
          (organization_id, website_url, service_hypotheses, website_observation, profile_source,
           last_verified_at, primary_service, problem_confirmed, next_action, created_at, updated_at)
         VALUES ($1, $2, ARRAY['GEO_VISIBILITY']::TEXT[], $3, 'CLIENT_REPORTED',
                 $4, 'GEO_VISIBILITY', 'YES', 'Follow up on GEO Score enquiry', $5, $5)
         ON CONFLICT (organization_id) DO UPDATE SET
           website_url = EXCLUDED.website_url,
           service_hypotheses = (
             SELECT ARRAY(
               SELECT DISTINCT value
               FROM unnest(sales_web_service_profiles.service_hypotheses || ARRAY['GEO_VISIBILITY']::TEXT[]) value
             )
           ),
           website_observation = EXCLUDED.website_observation,
           last_verified_at = EXCLUDED.last_verified_at,
           primary_service = 'GEO_VISIBILITY',
           problem_confirmed = 'YES',
           next_action = EXCLUDED.next_action,
           updated_at = EXCLUDED.updated_at`,
        [
          organizationId,
          input.websiteUrl,
          observation || "Article6 Signal analysis submitted by lead.",
          input.analyzedAt && !Number.isNaN(Date.parse(input.analyzedAt)) ? input.analyzedAt : now,
          now,
        ],
      );
    }

    const interactionId = randomUUID();
    const summary = [
      "Source: GEO_SCORE / Article6 Signal",
      `Goal: ${input.mainGoal}`,
      `Website: ${input.websiteUrl}`,
      input.overallScore == null ? "Overall score: unavailable" : `Overall score: ${input.overallScore}/100`,
      input.categoryScores
        ? `Category scores: ${Object.entries(input.categoryScores)
            .map(([name, value]) => `${name}=${value == null ? "unavailable" : value}`)
            .join(", ")}`
        : null,
      input.topFindings?.length
        ? `Top findings: ${input.topFindings.map((finding) => finding.title).join("; ")}`
        : null,
      input.scoringVersion ? `Scoring version: ${input.scoringVersion}` : null,
      input.analyzedAt ? `Analyzed at: ${input.analyzedAt}` : null,
      organizationExperiment === "WEB_SERVICES"
        ? null
        : `CRM note: existing organization kept in ${organizationExperiment}; Signal did not reclassify it.`,
      input.notes ? `Notes: ${input.notes.trim()}` : null,
    ].filter(Boolean).join("\n").slice(0, 8000);

    await client.query(
      `INSERT INTO sales_interactions
        (id, organization_id, contact_id, channel, direction, interaction_type, occurred_at,
         subject, summary, external_reference, created_at, is_imported)
       VALUES ($1, $2, $3, 'WEBSITE', 'INBOUND', 'CONTACT_FORM', $4, $5, $6, $7, $4, FALSE)`,
      [
        interactionId,
        organizationId,
        contactId,
        now,
        `Article6 Signal enquiry — ${input.mainGoal}`.slice(0, 200),
        summary,
        idempotencyKey,
      ],
    );

    await client.query("COMMIT");
    return { created: true };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
