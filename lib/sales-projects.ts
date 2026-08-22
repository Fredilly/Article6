import type { SalesOrganizationStatus } from "./sales-memory";

export type SalesProjectRollupStatus = SalesOrganizationStatus | "DO_NOT_CONTACT";
export const SALES_PROJECT_ORGANIZATION_ROLES = ["DEVELOPER", "OWNER", "CONSULTANT", "PDD_AUTHOR", "INVESTOR", "VALIDATION_BODY", "IMPLEMENTING_PARTNER", "OTHER"] as const;
export type SalesProjectOrganizationRole = typeof SALES_PROJECT_ORGANIZATION_ROLES[number];

const STATUS_RANK: Record<SalesOrganizationStatus, number> = {
  NEW: 0,
  CONTACTED: 10,
  NURTURE: 20,
  ENGAGED: 30,
  OPPORTUNITY: 40,
  CLOSED_WON: 50,
  CLOSED_NO: -1,
  PARKED: -2,
  DO_NOT_CONTACT: -3,
};

export function normalizeSalesVcsId(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase().replace(/^vcs\s*/, "");
  return normalized || undefined;
}

export function normalizeSalesProjectOrganizationRole(value?: string): SalesProjectOrganizationRole {
  const normalized = value?.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (normalized === "PROJECT_DEVELOPER") return "DEVELOPER";
  if (normalized === "PROJECT_OWNER") return "OWNER";
  if (normalized === "TECHNICAL_CONSULTANT") return "CONSULTANT";
  if (normalized === "PDD_WRITER") return "PDD_AUTHOR";
  if (normalized === "VALIDATOR" || normalized === "VVB") return "VALIDATION_BODY";
  if (normalized === "IMPLEMENTATION_PARTNER") return "IMPLEMENTING_PARTNER";
  return SALES_PROJECT_ORGANIZATION_ROLES.includes(normalized as SalesProjectOrganizationRole) ? normalized as SalesProjectOrganizationRole : "OTHER";
}

export function canonicalSalesProjectName(vcsId: string | undefined, name: string): string {
  const cleanName = name.trim();
  if (!vcsId) return cleanName;
  const withoutPrefix = cleanName.replace(new RegExp(`^vcs\\s*${vcsId.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}\\s*[·:|-]?\\s*`, "i"), "").trim();
  return `VCS ${vcsId} · ${withoutPrefix || `Project ${vcsId}`}`;
}

export function rollUpSalesProjectStatus(statuses: Array<{ status: SalesOrganizationStatus; doNotContact: boolean }>): { status: SalesProjectRollupStatus; blocked: boolean } {
  if (statuses.some((value) => value.doNotContact)) return { status: "DO_NOT_CONTACT", blocked: true };
  if (statuses.some((value) => value.status === "CLOSED_NO")) return { status: "CLOSED_NO", blocked: true };
  const status = statuses.reduce<SalesOrganizationStatus | undefined>((best, value) => {
    if (!best || STATUS_RANK[value.status] > STATUS_RANK[best]) return value.status;
    return best;
  }, undefined) || "NEW";
  return { status, blocked: false };
}
