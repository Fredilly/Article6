export const SALES_COLLATERAL_DOCUMENT_TYPES = ["SAMPLE_REVIEW","PROPOSAL","CASE_STUDY","METHODOLOGY","PRICING","BROCHURE","OTHER"] as const;
export type SalesCollateralDocumentType = typeof SALES_COLLATERAL_DOCUMENT_TYPES[number];

export function isSalesCollateralDocumentType(value: unknown): value is SalesCollateralDocumentType {
  return typeof value === "string" && (SALES_COLLATERAL_DOCUMENT_TYPES as readonly string[]).includes(value);
}
