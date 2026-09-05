import { Pool, type QueryResultRow } from "pg";

export const PROCUREMENT_FREQUENCY_BANDS = [
  "UNKNOWN",
  "ONE_TO_THREE",
  "FOUR_TO_TEN",
  "ELEVEN_TO_TWENTY_FIVE",
  "TWENTY_FIVE_PLUS",
] as const;
export type ProcurementFrequencyBand = (typeof PROCUREMENT_FREQUENCY_BANDS)[number];

export const PROCUREMENT_WINS_BANDS = ["UNKNOWN", "ZERO", "ONE_TO_TWO", "THREE_TO_FIVE", "SIX_PLUS"] as const;
export type ProcurementWinsBand = (typeof PROCUREMENT_WINS_BANDS)[number];

export const BID_DECISION_PROCESSES = ["UNKNOWN", "NONE", "INFORMAL", "FORMAL"] as const;
export type BidDecisionProcess = (typeof BID_DECISION_PROCESSES)[number];

export const BID_PREPARATION_MODELS = [
  "UNKNOWN",
  "FOUNDER_LED",
  "SALES_LED",
  "OPERATIONS_LED",
  "BID_TEAM",
  "EXTERNAL_CONSULTANT",
  "MIXED",
] as const;
export type BidPreparationModel = (typeof BID_PREPARATION_MODELS)[number];

export const INDEPENDENT_REVIEW_FREQUENCIES = [
  "UNKNOWN",
  "NEVER",
  "SOMETIMES",
  "USUALLY",
  "DEDICATED_INTERNAL_FUNCTION",
] as const;
export type IndependentReviewFrequency = (typeof INDEPENDENT_REVIEW_FREQUENCIES)[number];

export const EVIDENCE_LIBRARY_MATURITIES = ["UNKNOWN", "NONE", "INFORMAL", "PARTIALLY_STRUCTURED", "STRUCTURED"] as const;
export type EvidenceLibraryMaturity = (typeof EVIDENCE_LIBRARY_MATURITIES)[number];

export const PRIMARY_PROCUREMENT_PAINS = [
  "UNKNOWN",
  "DISCOVERY",
  "BID_NO_BID",
  "ELIGIBILITY",
  "REFERENCE_FIT",
  "EVIDENCE",
  "WRITING",
  "SCORING",
  "CONSISTENCY",
  "COMMERCIAL",
  "FINAL_REVIEW",
  "SUBMISSION",
] as const;
export type PrimaryProcurementPain = (typeof PRIMARY_PROCUREMENT_PAINS)[number];

export const PROCUREMENT_PROFILE_SOURCES = ["UNKNOWN", "CLIENT_REPORTED", "PUBLIC_DATA", "ARTICLE6_OBSERVED", "ARTICLE6_INFERENCE"] as const;
export type ProcurementProfileSource = (typeof PROCUREMENT_PROFILE_SOURCES)[number];

export const PROCUREMENT_PROFILE_CONFIDENCES = ["UNKNOWN", "LOW", "MEDIUM", "HIGH"] as const;
export type ProcurementProfileConfidence = (typeof PROCUREMENT_PROFILE_CONFIDENCES)[number];

export const PROCUREMENT_SIGNAL_TAGS = [
  "DISCOVERY_GAP",
  "BID_NO_BID",
  "REFERENCE_FIT",
  "EVIDENCE_REUSE",
  "FINAL_REVIEW",
  "AI_ALREADY_USED",
  "PRICE_PER_BID_RESISTANCE",
  "RECURRING_SUPPORT_INTEREST",
  "PAID_PILOT_SIGNAL",
  "REPEAT_USAGE_SIGNAL",
] as const;
export type ProcurementSignalTag = (typeof PROCUREMENT_SIGNAL_TAGS)[number];

export const PROCUREMENT_HYPOTHESIS_KEYS = [
  "tender_discovery_assist",
  "bid_no_bid_assist",
  "reusable_evidence_profile",
  "premium_final_review",
  "recurring_bid_desk",
] as const;
export type ProcurementHypothesisKey = (typeof PROCUREMENT_HYPOTHESIS_KEYS)[number];

export const BIDDER_SEGMENTS = ["UNKNOWN", "OCCASIONAL", "REGULAR", "MULTI_BIDDER"] as const;
export type BidderSegment = (typeof BIDDER_SEGMENTS)[number];

export const DISCOVERY_METHOD_OPTIONS = [
  "eTenders / public procurement portals",
  "Buyer portals",
  "Email alerts",
  "Commercial tender platforms",
  "Direct buyer relationships",
  "Partners / consultants",
] as const;

export const DISCOVERY_PROBLEM_OPTIONS = [
  "Tenderers sometimes use incorrect categories",
  "Current category configuration may not capture everything",
  "Too much irrelevant tender noise",
  "Relevant tenders are found too late",
  "Discovery is fragmented across portals",
] as const;

export const AI_USAGE_OPTIONS = ["ChatGPT", "Claude", "Gemini", "Microsoft Copilot", "Internal AI tools"] as const;

export interface SalesProcurementProfile {
  organizationId: string;
  opportunitiesConsideredBand?: ProcurementFrequencyBand;
  bidsSubmittedBand?: ProcurementFrequencyBand;
  winsBand?: ProcurementWinsBand;
  bidDecisionProcess?: BidDecisionProcess;
  bidDecisionOwnerContactId?: string;
  discoveryMethods?: string[];
  discoveryProblems?: string[];
  bidPreparationModel?: BidPreparationModel;
  aiUsage?: string[];
  independentReviewFrequency?: IndependentReviewFrequency;
  evidenceLibraryMaturity?: EvidenceLibraryMaturity;
  primaryProcurementPain?: PrimaryProcurementPain;
  profileSource?: ProcurementProfileSource;
  profileConfidence?: ProcurementProfileConfidence;
  lastVerifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bidderSegment: BidderSegment;
}

export interface SalesProcurementProfilePatch {
  opportunitiesConsideredBand?: ProcurementFrequencyBand | null;
  bidsSubmittedBand?: ProcurementFrequencyBand | null;
  winsBand?: ProcurementWinsBand | null;
  bidDecisionProcess?: BidDecisionProcess | null;
  bidDecisionOwnerContactId?: string | null;
  discoveryMethods?: string[] | null;
  discoveryProblems?: string[] | null;
  bidPreparationModel?: BidPreparationModel | null;
  aiUsage?: string[] | null;
  independentReviewFrequency?: IndependentReviewFrequency | null;
  evidenceLibraryMaturity?: EvidenceLibraryMaturity | null;
  primaryProcurementPain?: PrimaryProcurementPain | null;
  profileSource?: ProcurementProfileSource | null;
  profileConfidence?: ProcurementProfileConfidence | null;
  lastVerifiedAt?: string | null;
  notes?: string | null;
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

function optionalArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function member<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function isProcurementFrequencyBand(value: unknown): value is ProcurementFrequencyBand {
  return member(PROCUREMENT_FREQUENCY_BANDS, value);
}
export function isProcurementWinsBand(value: unknown): value is ProcurementWinsBand {
  return member(PROCUREMENT_WINS_BANDS, value);
}
export function isBidDecisionProcess(value: unknown): value is BidDecisionProcess {
  return member(BID_DECISION_PROCESSES, value);
}
export function isBidPreparationModel(value: unknown): value is BidPreparationModel {
  return member(BID_PREPARATION_MODELS, value);
}
export function isIndependentReviewFrequency(value: unknown): value is IndependentReviewFrequency {
  return member(INDEPENDENT_REVIEW_FREQUENCIES, value);
}
export function isEvidenceLibraryMaturity(value: unknown): value is EvidenceLibraryMaturity {
  return member(EVIDENCE_LIBRARY_MATURITIES, value);
}
export function isPrimaryProcurementPain(value: unknown): value is PrimaryProcurementPain {
  return member(PRIMARY_PROCUREMENT_PAINS, value);
}
export function isProcurementProfileSource(value: unknown): value is ProcurementProfileSource {
  return member(PROCUREMENT_PROFILE_SOURCES, value);
}
export function isProcurementProfileConfidence(value: unknown): value is ProcurementProfileConfidence {
  return member(PROCUREMENT_PROFILE_CONFIDENCES, value);
}
export function isProcurementSignalTag(value: unknown): value is ProcurementSignalTag {
  return member(PROCUREMENT_SIGNAL_TAGS, value);
}
export function isProcurementHypothesisKey(value: unknown): value is ProcurementHypothesisKey {
  return member(PROCUREMENT_HYPOTHESIS_KEYS, value);
}

export function deriveBidderSegment(bidsSubmittedBand?: ProcurementFrequencyBand | null): BidderSegment {
  switch (bidsSubmittedBand) {
    case "ONE_TO_THREE":
      return "OCCASIONAL";
    case "FOUR_TO_TEN":
      return "REGULAR";
    case "ELEVEN_TO_TWENTY_FIVE":
    case "TWENTY_FIVE_PLUS":
      return "MULTI_BIDDER";
    case "UNKNOWN":
    case undefined:
    case null:
    default:
      return "UNKNOWN";
  }
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
  const result = await getPool().query("SELECT * FROM sales_procurement_profiles WHERE organization_id = $1", [organizationId]);
  return result.rows[0] ? toProfile(result.rows[0]) : null;
}

export async function listSalesProcurementProfiles(): Promise<SalesProcurementProfile[]> {
  const result = await getPool().query("SELECT * FROM sales_procurement_profiles ORDER BY updated_at DESC, organization_id ASC");
  return result.rows.map(toProfile);
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
      await client.query(
        `UPDATE sales_procurement_profiles SET ${assignments.join(", ")} WHERE organization_id = $1`,
        values,
      );
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
  const result = await getPool().query(
    "SELECT signal_tags, hypothesis_key FROM sales_interactions WHERE id = $1 AND organization_id = $2",
    [interactionId, organizationId],
  );
  if (!result.rows[0]) return null;
  return {
    signalTags: (optionalArray(result.rows[0].signal_tags) || []) as ProcurementSignalTag[],
    hypothesisKey: optionalText(result.rows[0].hypothesis_key) as ProcurementHypothesisKey | undefined,
  };
}
