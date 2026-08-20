import Link from "next/link";
import { useState } from "react";
import SalesHeader, { type SalesStatusFilter } from "./SalesHeader";
import type { SalesMemorySearchEntry } from "./SalesMemorySearch";
import type { SalesOrganization } from "../lib/sales-store";

function rowClass(status: string, doNotContact: boolean) {
  if (doNotContact || status === "CLOSED_NO") return "border-l-4 border-red-400 bg-red-50/50 hover:bg-red-50";
  if (status === "CLOSED_WON" || status === "OPPORTUNITY") return "border-l-4 border-green-400 bg-green-50/40 hover:bg-green-50/70";
  if (status === "ENGAGED") return "border-l-4 border-violet-400 bg-violet-50/50 hover:bg-violet-50/80";
  if (status === "NURTURE") return "border-l-4 border-amber-400 bg-amber-50/40 hover:bg-amber-50/70";
  if (status === "CONTACTED") return "border-l-4 border-blue-300 hover:bg-blue-50/40";
  return "border-l-4 border-transparent hover:bg-gray-50";
}

function experimentLabel(value: string) {
  if (value === "ARTICLE6_CARBON") return "Article6 Carbon";
  if (value === "TENDER_READINESS") return "Tender Readiness";
  if (value === "ECOVADIS_SUPPLIER_COMPLIANCE") return "EcoVadis / Supplier Compliance";
  return "Other";
}

function statusClass(status: string) {
  return status === "ENGAGED" ? "bg-violet-100 text-violet-800" : status === "CONTACTED" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700";
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

  const filterList = () => {
    const needle = activeQuery.trim().toLowerCase();
    const ids = new Set(searchEntries.filter((entry) => needle.length < 2 || entry.searchText.includes(needle)).map((entry) => entry.organizationId));
    const result = organizations.filter((o) => (activeStatus === "ALL" || o.status === activeStatus) && (experiment === "ALL" || o.experiment === experiment) && ids.has(o.id));
    return [...result].sort((a, b) => {
      const ad = sortMode === "UPDATED" ? a.updatedAt : sortMode === "CONTACTED" ? a.lastInteractionAt : a.createdAt;
      const bd = sortMode === "UPDATED" ? b.updatedAt : sortMode === "CONTACTED" ? b.lastInteractionAt : b.createdAt;
      const diff = new Date(bd || 0).getTime() - new Date(ad || 0).getTime();
      return sortMode === "OLDEST" ? -diff : diff;
    });
  };

  const visibleOrganizations = filterList();

  function filterOrganizations(query: string, status: SalesStatusFilter) {
    setActiveQuery(query);
    setActiveStatus(status);
  }

  return <>
    <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} onChange={filterOrganizations} sectionTitle="Organizations" sectionCount={visibleOrganizations.length} />
    <div className="mt-3 flex flex-wrap gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <select value={experiment} onChange={(e) => setExperiment(e.target.value as ExperimentFilter)} className="rounded border px-3 py-2 text-sm"><option value="ALL">All Experiments</option><option value="ARTICLE6_CARBON">Article6 Carbon</option><option value="TENDER_READINESS">Tender Readiness</option></select>
      <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="rounded border px-3 py-2 text-sm"><option value="NEWEST">Newest First</option><option value="OLDEST">Oldest First</option><option value="UPDATED">Recently Updated</option><option value="CONTACTED">Recently Contacted</option></select>
    </div>
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"><table className="min-w-full divide-y divide-gray-200 text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Experiment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Last interaction</th><th /></tr></thead><tbody>{visibleOrganizations.map((organization) => <tr key={organization.id} className={rowClass(organization.status, organization.doNotContact)}><td className="px-5 py-4">{organization.name}<div className="text-xs text-gray-500">{organization.domain || "No domain"}</div></td><td className="px-5 py-4">{experimentLabel(organization.experiment)}</td><td className="px-5 py-4"><span className={statusClass(organization.status)}>{organization.status}</span></td><td className="px-5 py-4">{formatDate(organization.lastInteractionAt)}</td><td className="px-5 py-4 text-right"><Link href={`/internal/sales/organizations/${organization.id}`}>Open →</Link></td></tr>)}</tbody></table></div>
  </>;
}
