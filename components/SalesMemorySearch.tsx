import Link from "next/link";
import { useMemo, useState } from "react";

export interface SalesMemorySearchEntry {
  key: string;
  kind: "organization" | "project" | "contact";
  organizationId: string;
  title: string;
  subtitle: string;
  searchText: string;
  status: string;
  doNotContact: boolean;
}

const statuses = ["NEW", "CONTACTED", "ENGAGED", "NURTURE", "OPPORTUNITY", "CLOSED_WON", "CLOSED_NO"];

function statusClass(status: string) {
  if (status === "CLOSED_NO") return "bg-red-100 text-red-800";
  if (status === "CLOSED_WON") return "bg-emerald-100 text-emerald-800";
  if (status === "OPPORTUNITY") return "bg-green-100 text-green-800";
  if (status === "ENGAGED") return "bg-violet-100 text-violet-800";
  if (status === "NURTURE") return "bg-amber-100 text-amber-800";
  if (status === "CONTACTED") return "bg-blue-100 text-blue-800";
  return "bg-gray-100 text-gray-700";
}

export default function SalesMemorySearch({ entries }: { entries: SalesMemorySearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchesStatus = !statusFilter || entry.status === statusFilter;
      const matchesQuery = needle.length < 2 || entry.searchText.includes(needle);
      return matchesStatus && matchesQuery;
    }).slice(0, 12);
  }, [entries, query, statusFilter]);

  return <div className="relative mt-7">
    <input value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Start typing a VCS ID, project, organization, contact, email, methodology…" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100" />
    <div className="mt-3 flex flex-wrap gap-2">
      {statuses.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(statusFilter === status ? null : status)} className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClass(status)} ${statusFilter === status ? "ring-2 ring-offset-1" : ""}`}>{status}</button>)}
    </div>
    {(query.trim().length >= 2 || statusFilter) ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {results.length ? <div className="divide-y divide-gray-100">{results.map((result) => <Link key={result.key} href={`/internal/sales/organizations/${result.organizationId}`} className="block px-4 py-3 hover:bg-gray-50">
        <div className="flex flex-wrap items-center gap-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold">{result.kind.toUpperCase()}</span><span className="text-sm font-semibold">{result.title}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusClass(result.status)}`}>{result.status}</span></div>
        <div className="mt-1 text-xs text-gray-500">{result.subtitle}</div>
      </Link>)}</div> : <p className="px-4 py-3 text-sm text-gray-500">No matching sales-memory records.</p>}
    </div> : null}
  </div>;
}
