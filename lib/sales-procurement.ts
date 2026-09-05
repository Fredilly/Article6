import { Pool, type QueryResultRow } from "pg";
import {
  BID_DECISION_PROCESSES,
  BID_PREPARATION_MODELS,
  EVIDENCE_LIBRARY_MATURITIES,
  INDEPENDENT_REVIEW_FREQUENCIES,
  PRIMARY_PROCUREMENT_PAINS,
  PROCUREMENT_FREQUENCY_BANDS,
  PROCUREMENT_PROFILE_CONFIDENCES,
  PROCUREMENT_PROFILE_SOURCES,
  PROCUREMENT_WINS_BANDS,
  deriveBidderSegment,
  isProcurementHypothesisKey,
  isProcurementSignalTag,
  type BidDecisionProcess,
  type BidPreparationModel,
  type EvidenceLibraryMaturity,
  type IndependentReviewFrequency,
  type PrimaryProcurementPain,
  type ProcurementFrequencyBand,
  type ProcurementHypothesisKey,
  type ProcurementProfileConfidence,
  type ProcurementProfileSource,
  type ProcurementSignalTag,
  type ProcurementWinsBand,
  type SalesProcurementProfile,
  type SalesProcurementProfilePatch,
} from "./sales-procurement-domain";

export * from "./sales-procurement-domain";

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

function isMissingProcurementSchema(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = (error as { code?: string }).code;
  return code === "42P01" || code === "42703";
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function optionalText(value: unknown): string | undefined {
  return value == null || value === "" ? undefined : String(value);
}

function optionalArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function toProfile(row: QueryResultRow): SalesProcurementProfile {
  const bidsSubmittedBand = optionalText(row.bids_submitted_band) as ProcurementFrequencyBand | undefined;
  return {
    organizationId: String(row.organization_id),
    opportunitiesConsideredBand: optionalText(row.opportunities_considered_band) as ProcurementFrequencyBand | undefined,
    bidsSubmittedBand,
    winsBand: optionalText(row.wins_band) as ProcurementWinsBand | undefined,
    bidDecisionProcess: optionalText(row.bid_decision_process) as BidDecisionProcess | undefined,
    bidDecisionOwnerContactId: optionalText(row.bid_decision_owner_contact_id),
    discoveryMethods: optionalArray(row.discovery_methods),
    discoveryProblems: optionalArray(row.discovery_problems),
    bidPreparationModel: optionalText(row.bid_preparation_model) as BidPreparationModel | undefined,
    aiUsage: optionalArray(row.ai_usage),
    independentReviewFrequency: optionalText(row.independent_review_frequency) as IndependentReviewFrequency | undefined,
    evidenceLibraryMaturity: optionalText(row.evidence_library_maturity) as EvidenceLibraryMaturity | undefined,
    primaryProcurementPain: optionalText(row.primary_procurement_pain) as PrimaryProcurementPain | undefined,
    profileSource: optionalText(row.profile_source) as ProcurementProfileSource | undefined,
    profileConfidence: optionalText(row.profile_confidence) as ProcurementProfileConfidence | undefined,
    lastVerifiedAt: row.last_verified_at ? iso(row.last_verified_at) : undefined,
    notes: optionalText(row.notes),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    bidderSegment: deriveBidderSegment(bidsSubmittedBand),
  };
}

export async function getSalesProcurementProfile(organizationId: string): Promise<SalesProcurementProfile | null> {
  try {
    const result = await getPool().query("SELECT * FROM sales_procurement_profiles WHERE organization_id = $1", [organizationId]);
    return result.rows[0] ? toProfile(result.rows[0]) : null;
  } catch (error) {
    if (isMissingProcurementSchema(error)) return null;
    throw error;
  }
}

export async function listSalesProcurementProfiles(): Promise<SalesProcurementProfile[]> {
  try {
    const result = await getPool().query("SELECT * FROM sales_procurement_profiles ORDER BY updated_at DESC, organization_id ASC");
    return result.rows.map(toProfile);
  } catch (error) {
    if (isMissingProcurementSchema(error)) return [];
    throw error;
  }
}

function validatePatch(patch: SalesProcurementProfilePatch) {
  const checks: Array<[keyof SalesProcurementProfilePatch, readonly string[], unknown]> = [
    ["opportunitiesConsideredBand", PROCUREMENT_FREQUENCY_BANDS, patch.opportunitiesConsideredBand],
    ["bidsSubmittedBand", PROCUREMENT_FREQUENCY_BANDS, patch.bidsSubmittedBand],
    ["winsBand", PROCUREMENT_WINS_BANDS, patch.winsBand],
    ["bidDecisionProcess", BID_DECISION_PROCESSES, patch.bidDecisionProcess],
    ["bidPreparationModel", BID_PREPARATION_MODELS, patch.bidPreparationModel],
    ["independentReviewFrequency", INDEPENDENT_REVIEW_FREQUENCIES, patch.independentReviewFrequency],
    ["evidenceLibraryMaturity", EVIDENCE_LIBRARY_MATURITIES, patch.evidenceLibraryMaturity],
    ["primaryProcurementPain", PRIMARY_PROCUREMENT_PAINS, patch.primaryProcurementPain],
    ["profileSource", PROCUREMENT_PROFILE_SOURCES, patch.profileSource],
    ["profileConfidence", PROCUREMENT_PROFILE_CONFIDENCES, patch.profileConfidence],
  ];
  for (const [key, values, value] of checks) {
    if (value != null && !values.includes(String(value))) throw new Error(`Invalid procurement profile value for ${String(key)}.`);
  }
  if (patch.lastVerifiedAt && Number.isNaN(Date.parse(patch.lastVerifiedAt))) throw new Error("Invalid procurement profile verification date.");
}

export async function upsertSalesProcurementProfile(organizationId: string, patch: SalesProcurementProfilePatch): Promise<SalesProcurementProfile> {
  validatePatch(patch);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const org = await client.query("SELECT id FROM sales_organizations WHERE id = $1", [organizationId]);
    if (!org.rows[0]) throw new Error("Organization not found.");

    if (patch.bidDecisionOwnerContactId) {
      const contact = await client.query(
        "SELECT id FROM sales_contacts WHERE id = $1 AND organization_id = $2",
        [patch.bidDecisionOwnerContactId, organizationId],
      );
      if (!contact.rows[0]) throw new Error("Bid decision owner contact does not belong to this organization.");
    }

    await client.query(
      `INSERT INTO sales_procurement_profiles (organization_id, created_at, updated_at)
       VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (organization_id) DO NOTHING`,
      [organizationId],
    );

    const columnMap: Record<keyof SalesProcurementProfilePatch, string> = {
      opportunitiesConsideredBand: "opportunities_considered_band",
      bidsSubmittedBand: "bids_submitted_band",
      winsBand: "wins_band",
      bidDecisionProcess: "bid_decision_process",
      bidDecisionOwnerContactId: "bid_decision_owner_contact_id",
      discoveryMethods: "discovery_methods",
      discoveryProblems: "discovery_problems",
      bidPreparationModel: "bid_preparation_model",
      aiUsage: "ai_usage",
      independentReviewFrequency: "independent_review_frequency",
      evidenceLibraryMaturity: "evidence_library_maturity",
      primaryProcurementPain: "primary_procurement_pain",
      profileSource: "profile_source",
      profileConfidence: "profile_confidence",
      lastVerifiedAt: "last_verified_at",
      notes: "notes",
    };
    const keys = (Object.keys(patch) as Array<keyof SalesProcurementProfilePatch>).filter((key) => patch[key] !== undefined);
    if (keys.length) {
      const values: unknown[] = [organizationId];
      const assignments = keys.map((key, index) => {
        values.push(patch[key] ?? null);
        return `${columnMap[key]} = $${index + 2}`;
      });
      assignments.push("updated_at = CURRENT_TIMESTAMP");
      await client.query(`UPDATE sales_procurement_profiles SET ${assignments.join(", ")} WHERE organization_id = $1`, values);
    }

    const verified = await client.query("SELECT * FROM sales_procurement_profiles WHERE organization_id = $1", [organizationId]);
    if (!verified.rows[0]) throw new Error("Procurement profile verification failed after update.");
    await client.query("COMMIT");
    return toProfile(verified.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function setSalesInteractionSignals(input: {
  organizationId: string;
  interactionId: string;
  signalTags?: ProcurementSignalTag[] | null;
  hypothesisKey?: ProcurementHypothesisKey | null;
}): Promise<{ signalTags: ProcurementSignalTag[]; hypothesisKey?: ProcurementHypothesisKey }> {
  const tags = input.signalTags ?? [];
  for (const tag of tags) if (!isProcurementSignalTag(tag)) throw new Error(`Invalid procurement signal tag: ${String(tag)}.`);
  if (input.hypothesisKey != null && !isProcurementHypothesisKey(input.hypothesisKey)) throw new Error("Invalid procurement hypothesis key.");

  const result = await getPool().query(
    `UPDATE sales_interactions
     SET signal_tags = $3::text[], hypothesis_key = $4
     WHERE id = $1 AND organization_id = $2
     RETURNING signal_tags, hypothesis_key`,
    [input.interactionId, input.organizationId, tags.length ? tags : null, input.hypothesisKey ?? null],
  );
  if (!result.rows[0]) throw new Error("Interaction not found for this organization.");
  return {
    signalTags: (optionalArray(result.rows[0].signal_tags) || []) as ProcurementSignalTag[],
    hypothesisKey: optionalText(result.rows[0].hypothesis_key) as ProcurementHypothesisKey | undefined,
  };
}

export async function getSalesInteractionSignals(organizationId: string, interactionId: string): Promise<{ signalTags: ProcurementSignalTag[]; hypothesisKey?: ProcurementHypothesisKey } | null> {
  try {
    const result = await getPool().query(
      "SELECT signal_tags, hypothesis_key FROM sales_interactions WHERE id = $1 AND organization_id = $2",
      [interactionId, organizationId],
    );
    if (!result.rows[0]) return null;
    return {
      signalTags: (optionalArray(result.rows[0].signal_tags) || []) as ProcurementSignalTag[],
      hypothesisKey: optionalText(result.rows[0].hypothesis_key) as ProcurementHypothesisKey | undefined,
    };
  } catch (error) {
    if (isMissingProcurementSchema(error)) return { signalTags: [] };
    throw error;
  }
}
