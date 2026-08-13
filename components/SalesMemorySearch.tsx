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

export default function SalesMemorySearch({ entries }: { entries: SalesMemorySearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return entries.filter((entry) => entry.searchText.includes(needle)).slice(0, 12);
  }, [entries, query]);

  return <div className="relative mt-7">
    <input value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Start typing a VCS ID, project, organization, contact, email, methodology…" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100" />
    {query.trim().length >= 2 ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {results.length ? <div className="divide-y divide-gray-100">{results.map((result) => <Link key={result.key} href={`/internal/sales/organizations/${result.organizationId}`} className={`block px-4 py-3 hover:bg-gray-50 ${result.doNotContact ? "bg-red-50/60" : ""}`}>
        <div className="flex items-center gap-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-500">{result.kind.toUpperCase()}</span><span className="text-sm font-semibold text-gray-900">{result.title}</span>{result.doNotContact ? <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">DO NOT CONTACT</span> : null}</div>
        <div className="mt-1 text-xs text-gray-500">{result.subtitle} · {result.status}</div>
      </Link>)}</div> : <p className="px-4 py-3 text-sm text-gray-500">No matching sales-memory records.</p>}
    </div> : null}
  </div>;
}
