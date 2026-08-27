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
    if (sortMode === "NEWEST") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    }
    if (sortMode === "OLDEST") {
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    if (sortMode === "UPDATED") {
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    }
    return new Date(b.lastInteractionAt || 0).getTime() - new Date(a.lastInteractionAt || 0).getTime();
  });

  return <>
    <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} onChange={(q, s) => { setActiveQuery(q); setActiveStatus(s); }} sectionTitle="Organizations" sectionCount={visibleOrganizations.length} />
    <div className="mt-3 flex gap-3 rounded-lg border bg-white p-3">
      <select value={experiment} onChange={(e) => setExperiment(e.target.value as ExperimentFilter)}><option value="ALL">All Experiments</option><option value="ARTICLE6_CARBON">Article6 Carbon</option><option value="TENDER_READINESS">Tender Readiness</option></select>
      <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}><option value="NEWEST">Newest First</option><option value="OLDEST">Oldest First</option><option value="UPDATED">Recently Updated</option><option value="CONTACTED">Recently Contacted</option></select>
    </div>
    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><th className="w-[30%] px-5 py-3 font-medium">Organization</th><th className="w-[25%] px-5 py-3 font-medium">Experiment</th><th className="px-5 py-3 font-medium">Status</th><th className="whitespace-nowrap px-5 py-3 font-medium">Last interaction</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-gray-100">{visibleOrganizations.map((o) => <tr key={o.id} className={rowClass(o.status, o.doNotContact)}><td className="px-5 py-4 align-top"><div className="font-semibold text-gray-900">{o.name}</div><div className="mt-1 text-xs text-gray-500">{o.domain || "No domain"}</div></td><td className="px-5 py-4 align-top text-gray-700">{experimentLabel(o.experiment)}</td><td className="whitespace-nowrap px-5 py-4 align-top text-gray-700">{o.status}</td><td className="whitespace-nowrap px-5 py-4 align-top text-gray-600">{formatDate(o.lastInteractionAt)}</td><td className="whitespace-nowrap px-5 py-4 text-right"><Link href={`/internal/sales/organizations/${o.id}`} className="font-medium text-forest-700 hover:underline">Open →</Link></td></tr>)}</tbody></table>
    </div>
  </>;
}
