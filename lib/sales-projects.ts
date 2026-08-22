import type { SalesOrganizationStatus } from "./sales-memory";

export type SalesProjectRollupStatus = SalesOrganizationStatus | "DO_NOT_CONTACT";

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
