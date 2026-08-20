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

function statusClass(status: string) {
  if (status === "CLOSED_NO") return "bg-red-100 text-red-800 ring-1 ring-inset ring-red-200";
  if (status === "CLOSED_WON") return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200";
  if (status === "OPPORTUNITY") return "bg-green-100 text-green-800 ring-1 ring-inset ring-green-200";
  if (status === "ENGAGED") return "bg-violet-100 text-violet-800 ring-1 ring-inset ring-violet-200";
  if (status === "NURTURE") return "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200";
  if (status === "CONTACTED") return "bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200";
  return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200";
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

export default function SalesOrganizationsTable({ organizations, searchEntries, initialQuery, initialStatus }: { organizations: SalesOrganization[]; searchEntries: SalesMemorySearchEntry[]; initialQuery?: string; initialStatus?: SalesStatusFilter }) {
  function filterList(query: string, status: SalesStatusFilter) {
    const needle = query.trim().toLowerCase();
    const matchingIds = new Set(searchEntries.filter((entry) => needle.length < 2 || entry.searchText.includes(needle)).map((entry) => entry.organizationId));
    return organizations.filter((organization) => (status === "ALL" || organization.status === status) && matchingIds.has(organization.id));
  }

  const [visibleOrganizations, setVisibleOrganizations] = useState(() => filterList(initialQuery || "", initialStatus || "ALL"));
  const [activeQuery, setActiveQuery] = useState(initialQuery || "");
  const [activeStatus, setActiveStatus] = useState<SalesStatusFilter>(initialStatus || "ALL");

  function filterOrganizations(query: string, status: SalesStatusFilter) {
    setActiveQuery(query);
    setActiveStatus(status);
    setVisibleOrganizations(filterList(query, status));
  }

  return <>
    <SalesHeader entries={searchEntries} initialQuery={initialQuery} initialStatus={initialStatus} onChange={filterOrganizations} sectionTitle="Organizations" sectionCount={visibleOrganizations.length} />
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {visibleOrganizations.length === 0 ? <p className="p-6 text-sm text-gray-600">No organizations found.</p> : <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Organization</th><th className="px-5 py-3">Experiment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Projects</th><th className="px-5 py-3">Last interaction</th><th className="px-5 py-3"><span className="sr-only">Action</span></th></tr></thead>
        <tbody className="divide-y divide-gray-100">{visibleOrganizations.map((organization) => <tr key={organization.id} className={rowClass(organization.status, organization.doNotContact)}>
          <td className="px-5 py-4"><div className="font-medium text-gray-900">{organization.name}</div><div className="text-xs text-gray-500">{organization.domain || "No domain"}</div></td>
          <td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{experimentLabel(organization.experiment)}</span></td>
          <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(organization.status)}`}>{organization.status}</span>{organization.doNotContact ? <div className="mt-1 text-xs font-semibold text-red-700">DO NOT CONTACT</div> : null}</td>
          <td className="px-5 py-4">{organization.projectCount || 0}</td>
          <td className="whitespace-nowrap px-5 py-4 text-gray-600">{formatDate(organization.lastInteractionAt)}</td>
          <td className="px-5 py-4 text-right"><Link href={{ pathname: `/internal/sales/organizations/${organization.id}`, query: { ...(activeQuery ? { q: activeQuery } : {}), ...(activeStatus !== "ALL" ? { status: activeStatus } : {}) } }} className="font-medium text-forest-700 hover:text-forest-800">Open →</Link></td>
        </tr>)}</tbody>
      </table></div>}
    </div>
  </>;
}
