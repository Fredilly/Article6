import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import SalesMemorySearch, { type SalesMemorySearchEntry } from "./SalesMemorySearch";
import { SALES_ORGANIZATION_STATUSES, type SalesOrganizationStatus } from "../lib/sales-memory";

export type SalesStatusFilter = "ALL" | SalesOrganizationStatus;

interface Props {
  entries: SalesMemorySearchEntry[];
  initialQuery?: string;
  initialStatus?: SalesStatusFilter;
  onChange?: (query: string, status: SalesStatusFilter) => void;
  sectionTitle?: string;
  sectionCount?: number;
}

function statusClass(status: SalesStatusFilter, active: boolean) {
  const activeClass = active ? "ring-2 ring-offset-1 ring-gray-700" : "";
  if (status === "CLOSED_NO") return `bg-red-100 text-red-800 ${activeClass}`;
  if (status === "CLOSED_WON") return `bg-emerald-100 text-emerald-800 ${activeClass}`;
  if (status === "OPPORTUNITY") return `bg-green-100 text-green-800 ${activeClass}`;
  if (status === "ENGAGED") return `bg-violet-100 text-violet-800 ${activeClass}`;
  if (status === "NURTURE") return `bg-amber-100 text-amber-800 ${activeClass}`;
  if (status === "CONTACTED") return `bg-blue-100 text-blue-800 ${activeClass}`;
  return `bg-gray-100 text-gray-700 ${activeClass}`;
}

export default function SalesHeader({ entries, initialQuery = "", initialStatus = "ALL", onChange, sectionTitle, sectionCount }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<SalesStatusFilter>(initialStatus);

  function update(nextQuery: string, nextStatus: SalesStatusFilter) {
    setQuery(nextQuery);
    setStatus(nextStatus);
    onChange?.(nextQuery, nextStatus);
  }

  function chooseStatus(nextStatus: SalesStatusFilter) {
    if (onChange) update(query, nextStatus);
    else router.push({ pathname: "/internal/sales", query: { ...(query ? { q: query } : {}), ...(nextStatus !== "ALL" ? { status: nextStatus } : {}) } });
  }

  return <>
    <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Sales memory</h1><p className="mt-2 text-sm text-gray-600">Search first. Keep every experiment in one history so we do not re-contact people blindly.</p></div>
      <Link href="/internal/sales/email-tracking" className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">Email tracking</Link>
    </div>
    <SalesMemorySearch entries={entries} query={query} status={status} onQueryChange={(value) => update(value, status)} />
    {sectionTitle ? <div className="mt-7 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-base font-semibold">{sectionTitle}</h2><p className="mt-1 text-xs text-gray-500">Most recently active first.</p></div><span className="text-xs text-gray-500">{sectionCount} total</span></div> : null}
    <div className="mt-3 flex flex-wrap gap-2" aria-label="Sales status filters">
      <button type="button" onClick={() => chooseStatus("ALL")} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass("ALL", status === "ALL")}`}>ALL</button>
      {SALES_ORGANIZATION_STATUSES.map((value) => <button type="button" key={value} onClick={() => chooseStatus(value)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(value, status === value)}`}>{value}</button>)}
    </div>
  </>;
}
