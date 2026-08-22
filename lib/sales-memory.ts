export const SALES_ORGANIZATION_STATUSES = [
  "NEW",
  "CONTACTED",
  "ENGAGED",
  "OPPORTUNITY",
  "NURTURE",
  "CLOSED_NO",
  "CLOSED_WON",
] as const;

export type SalesOrganizationStatus = (typeof SALES_ORGANIZATION_STATUSES)[number];

export const SALES_EXPERIMENTS = [
  "ARTICLE6_CARBON",
  "TENDER_READINESS",
  "ECOVADIS_SUPPLIER_COMPLIANCE",
  "OTHER",
] as const;

export type SalesExperiment = (typeof SALES_EXPERIMENTS)[number];

export const SALES_TENDER_STATUSES = [
  "NEW",
  "DOCUMENTS_REQUESTED",
  "DOCUMENTS_RECEIVED",
  "SUBMITTED",
  "AWARDED",
  "NOT_AWARDED",
] as const;

export type SalesTenderStatus = (typeof SALES_TENDER_STATUSES)[number];

export function isSalesTenderStatus(value: unknown): value is SalesTenderStatus {
  return typeof value === "string" && SALES_TENDER_STATUSES.includes(value as SalesTenderStatus);
}

export const SALES_OBJECTION_CODES = [
  "INTERNAL_TEAM",
  "ALREADY_COVERED",
  "VALIDATION_ADVANCED",
  "NO_BUDGET",
  "NO_CURRENT_NEED",
  "WRONG_PERSON",
  "EXTERNAL_CONSULTANT",
  "TIMING",
  "NO_RESPONSE",
  "OTHER",
] as const;

export type SalesObjectionCode = (typeof SALES_OBJECTION_CODES)[number];

export function normalizeOrganizationName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeDomain(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || null;
}

export function normalizeOptional(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function isSalesOrganizationStatus(value: unknown): value is SalesOrganizationStatus {
  return typeof value === "string" && SALES_ORGANIZATION_STATUSES.includes(value as SalesOrganizationStatus);
}

export function isSalesExperiment(value: unknown): value is SalesExperiment {
  return typeof value === "string" && SALES_EXPERIMENTS.includes(value as SalesExperiment);
}

export function isSalesObjectionCode(value: unknown): value is SalesObjectionCode {
  return typeof value === "string" && SALES_OBJECTION_CODES.includes(value as SalesObjectionCode);
}
