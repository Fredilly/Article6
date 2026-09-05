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
  "UNKNOWN", "FOUNDER_LED", "SALES_LED", "OPERATIONS_LED", "BID_TEAM", "EXTERNAL_CONSULTANT", "MIXED",
] as const;
export type BidPreparationModel = (typeof BID_PREPARATION_MODELS)[number];

export const INDEPENDENT_REVIEW_FREQUENCIES = [
  "UNKNOWN", "NEVER", "SOMETIMES", "USUALLY", "DEDICATED_INTERNAL_FUNCTION",
] as const;
export type IndependentReviewFrequency = (typeof INDEPENDENT_REVIEW_FREQUENCIES)[number];

export const EVIDENCE_LIBRARY_MATURITIES = ["UNKNOWN", "NONE", "INFORMAL", "PARTIALLY_STRUCTURED", "STRUCTURED"] as const;
export type EvidenceLibraryMaturity = (typeof EVIDENCE_LIBRARY_MATURITIES)[number];

export const PRIMARY_PROCUREMENT_PAINS = [
  "UNKNOWN", "DISCOVERY", "BID_NO_BID", "ELIGIBILITY", "REFERENCE_FIT", "EVIDENCE", "WRITING", "SCORING", "CONSISTENCY", "COMMERCIAL", "FINAL_REVIEW", "SUBMISSION",
] as const;
export type PrimaryProcurementPain = (typeof PRIMARY_PROCUREMENT_PAINS)[number];

export const PROCUREMENT_PROFILE_SOURCES = ["UNKNOWN", "CLIENT_REPORTED", "PUBLIC_DATA", "ARTICLE6_OBSERVED", "ARTICLE6_INFERENCE"] as const;
export type ProcurementProfileSource = (typeof PROCUREMENT_PROFILE_SOURCES)[number];

export const PROCUREMENT_PROFILE_CONFIDENCES = ["UNKNOWN", "LOW", "MEDIUM", "HIGH"] as const;
export type ProcurementProfileConfidence = (typeof PROCUREMENT_PROFILE_CONFIDENCES)[number];

export const PROCUREMENT_SIGNAL_TAGS = [
  "DISCOVERY_GAP", "BID_NO_BID", "REFERENCE_FIT", "EVIDENCE_REUSE", "FINAL_REVIEW", "AI_ALREADY_USED",
  "PRICE_PER_BID_RESISTANCE", "RECURRING_SUPPORT_INTEREST", "PAID_PILOT_SIGNAL", "REPEAT_USAGE_SIGNAL",
] as const;
export type ProcurementSignalTag = (typeof PROCUREMENT_SIGNAL_TAGS)[number];

export const PROCUREMENT_HYPOTHESIS_KEYS = [
  "tender_discovery_assist", "bid_no_bid_assist", "reusable_evidence_profile", "premium_final_review", "recurring_bid_desk",
] as const;
export type ProcurementHypothesisKey = (typeof PROCUREMENT_HYPOTHESIS_KEYS)[number];

export const BIDDER_SEGMENTS = ["UNKNOWN", "OCCASIONAL", "REGULAR", "MULTI_BIDDER"] as const;
export type BidderSegment = (typeof BIDDER_SEGMENTS)[number];

export const DISCOVERY_METHOD_OPTIONS = [
  "eTenders / public procurement portals", "Buyer portals", "Email alerts", "Commercial tender platforms", "Direct buyer relationships", "Partners / consultants",
] as const;

export const DISCOVERY_PROBLEM_OPTIONS = [
  "Tenderers sometimes use incorrect categories", "Current category configuration may not capture everything", "Too much irrelevant tender noise", "Relevant tenders are found too late", "Discovery is fragmented across portals",
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

function member<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function isProcurementFrequencyBand(value: unknown): value is ProcurementFrequencyBand { return member(PROCUREMENT_FREQUENCY_BANDS, value); }
export function isProcurementWinsBand(value: unknown): value is ProcurementWinsBand { return member(PROCUREMENT_WINS_BANDS, value); }
export function isBidDecisionProcess(value: unknown): value is BidDecisionProcess { return member(BID_DECISION_PROCESSES, value); }
export function isBidPreparationModel(value: unknown): value is BidPreparationModel { return member(BID_PREPARATION_MODELS, value); }
export function isIndependentReviewFrequency(value: unknown): value is IndependentReviewFrequency { return member(INDEPENDENT_REVIEW_FREQUENCIES, value); }
export function isEvidenceLibraryMaturity(value: unknown): value is EvidenceLibraryMaturity { return member(EVIDENCE_LIBRARY_MATURITIES, value); }
export function isPrimaryProcurementPain(value: unknown): value is PrimaryProcurementPain { return member(PRIMARY_PROCUREMENT_PAINS, value); }
export function isProcurementProfileSource(value: unknown): value is ProcurementProfileSource { return member(PROCUREMENT_PROFILE_SOURCES, value); }
export function isProcurementProfileConfidence(value: unknown): value is ProcurementProfileConfidence { return member(PROCUREMENT_PROFILE_CONFIDENCES, value); }
export function isProcurementSignalTag(value: unknown): value is ProcurementSignalTag { return member(PROCUREMENT_SIGNAL_TAGS, value); }
export function isProcurementHypothesisKey(value: unknown): value is ProcurementHypothesisKey { return member(PROCUREMENT_HYPOTHESIS_KEYS, value); }

export function deriveBidderSegment(bidsSubmittedBand?: ProcurementFrequencyBand | null): BidderSegment {
  switch (bidsSubmittedBand) {
    case "ONE_TO_THREE": return "OCCASIONAL";
    case "FOUR_TO_TEN": return "REGULAR";
    case "ELEVEN_TO_TWENTY_FIVE":
    case "TWENTY_FIVE_PLUS": return "MULTI_BIDDER";
    default: return "UNKNOWN";
  }
}
