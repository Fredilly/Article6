import Link from "next/link";
import { useState } from "react";
import SalesHeader, { type SalesStatusFilter } from "./SalesHeader";
import type { SalesMemorySearchEntry } from "./SalesMemorySearch";
import type { SalesOrganization } from "../lib/sales-store";

function rowClass(status: string, doNotContact: boolean) {
  if (doNotContact || status === "CLOSED_NO") return "border-l-4 border-red-400 bg-red-50/50";
  if (status === "CLOSED_WON" || status === "OPPORTUNITY") return "border-l-4 border-green-400";
  if (status === "ENGAGED") return "border-l-4 border-violet-400";
  if (status === "NURTURE") return "border-l-4 border-amber-400";
  if (status === "CONTACTED") return "border-l-4 border-blue-300";
  return "";
}

function experimentLabel(value: string) {
  if (value === "ARTICLE6_CARBON") return "Article6 Carbon";
  if (value === "TENDER_READINESS") return "Tender Readiness";
  if (value === "ECOVADIS_SUPPLIER_COMPLIANCE") return "EcoVadis / Supplier Compliance";
  return "Other";
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "Never";
}

type ExperimentFilter = "ALL" | SalesOrganization["experiment"];
type SortMode = "NEWEST" | "OLDEST" | "UPDATED" | "CONTACTED";

export default function SalesOrganizationsTable({ organizations, searchEntries, initialQuery, initialStatus }: { organizations: SalesOrganization[]; searchEntries: SalesMemorySearchEntry[]; initialQuery?: string; initialStatus?: SalesStatusFilter }) {
  const [activeQuery, setActiveQuery] = useState(initialQuery || "");
  const [activeStatus, setActiveStatus] = useState<SalesStatusFilter>(initialStatus || "ALL");
  const [experiment, setExperiment] = useState<ExperimentFilter>("ALL");
  const [sortMode, setSortMode] = useState<SortMode>("NEWEST");

  const visibleOrganizations = [...organizations.filter((o) => {
    const needle = activeQuery.trim().toLowerCase();
    const matchesSearch = needle.length < 2 || searchEntries.some((e) => e.organizationId === o.id && e.searchText.includes(needle));
    return matchesSearch && (activeStatus === "ALL" || o.status === activeStatus) && (experiment === "ALL" || o.experiment === experiment);
  })].sort((a, b) => {
    const ad = sortMode === "UPDATED" ? a.updatedAt : a.lastInteractionAt;
    const bd = sortMode === "UPDATED" ? b.updatedAt : b.lastInteractionAt;
    const diff = new Date(bd || 0).getTime() - new Date(ad || 0).getTime();
    return sortMode === "OLDEST" ? -diff : diff;
  });

  return <>
    <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} onChange={(q, s) => { setActiveQuery(q); setActiveStatus(s); }} sectionTitle="Organizations" sectionCount={visibleOrganizations.length} />
    <div className="mt-3 flex gap-3 rounded-lg border bg-white p-3">
      <select value={experiment} onChange={(e) => setExperiment(e.target.value as ExperimentFilter)}><option value="ALL">All Experiments</option><option value="ARTICLE6_CARBON">Article6 Carbon</option><option value="TENDER_READINESS">Tender Readiness</option></select>
      <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}><option value="NEWEST">Newest First</option><option value="OLDEST">Oldest First</option><option value="UPDATED">Recently Updated</option><option value="CONTACTED">Recently Contacted</option></select>
    </div>
    <table className="mt-3 min-w-full text-left text-sm"><thead><tr><th>Organization</th><th>Experiment</th><th>Status</th><th>Last interaction</th><th /></tr></thead><tbody>{visibleOrganizations.map((o) => <tr key={o.id} className={rowClass(o.status, o.doNotContact)}><td>{o.name}<div>{o.domain || "No domain"}</div></td><td>{experimentLabel(o.experiment)}</td><td>{o.status}</td><td>{formatDate(o.lastInteractionAt)}</td><td><Link href={`/internal/sales/organizations/${o.id}`}>Open →</Link></td></tr>)}</tbody></table>
  </>;
}
