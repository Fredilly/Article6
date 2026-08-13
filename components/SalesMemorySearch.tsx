import Link from "next/link";
import { Fragment, useMemo, useState } from "react";

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

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function distance(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function tolerance(token: string) {
  if (/^\d+$/.test(token)) return 0;
  if (token.length <= 4) return 1;
  if (token.length <= 8) return 2;
  return 3;
}

function tokenMatchesWord(token: string, word: string) {
  if (!token || !word) return false;
  if (word.includes(token) || token.includes(word)) return true;
  return distance(token, word) <= tolerance(token);
}

function scoreEntry(entry: SalesMemorySearchEntry, rawQuery: string) {
  const query = normalize(rawQuery);
  const text = normalize(entry.searchText);
  const title = normalize(entry.title);
  if (!query) return Number.POSITIVE_INFINITY;

  const kindBias = entry.kind === "project" ? 0 : entry.kind === "organization" ? 3 : 6;
  if (title === query) return kindBias;
  if (title.startsWith(query)) return 5 + kindBias;
  if (title.includes(query)) return 10 + kindBias;
  if (text.includes(query)) return 15 + kindBias;

  const words = text.split(/[^a-z0-9@.+-]+/).filter(Boolean);
  const tokens = query.split(/\s+/).filter(Boolean);
  let score = 20 + kindBias;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      if (!text.includes(token)) return Number.POSITIVE_INFINITY;
      continue;
    }
    if (text.includes(token)) continue;
    let best = Number.POSITIVE_INFINITY;
    for (const word of words) {
      if (Math.abs(word.length - token.length) > tolerance(token)) continue;
      best = Math.min(best, distance(token, word));
    }
    if (best > tolerance(token)) return Number.POSITIVE_INFINITY;
    score += 10 + best * 8;
  }

  return score;
}

function Highlight({ text, query }: { text: string; query: string }) {
  const queryTokens = normalize(query).split(/\s+/).filter(Boolean);
  if (!queryTokens.length) return <>{text}</>;
  const parts = text.split(/(\s+|[·,/()\-–—])/);
  return <>{parts.map((part, index) => {
    const word = normalize(part).replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
    const matched = word && queryTokens.some((token) => tokenMatchesWord(token, word));
    return <Fragment key={`${part}-${index}`}>{matched ? <mark className="rounded-sm bg-amber-100 px-0.5 text-inherit">{part}</mark> : part}</Fragment>;
  })}</>;
}

export default function SalesMemorySearch({ entries }: { entries: SalesMemorySearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const needle = query.trim();
    if (needle.length < 2) return [];
    return entries
      .map((entry) => ({ entry, score: scoreEntry(entry, needle) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((a, b) => a.score - b.score || a.entry.title.localeCompare(b.entry.title))
      .slice(0, 12)
      .map(({ entry }) => entry);
  }, [entries, query]);

  return <div className="relative mt-7">
    <input value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" placeholder="Start typing a VCS ID, project, organization, contact, email, methodology…" className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base shadow-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100" />
    {query.trim().length >= 2 ? <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {results.length ? <div className="divide-y divide-gray-100">{results.map((result) => <Link key={result.key} href={`/internal/sales/organizations/${result.organizationId}`} className={`block px-4 py-3 hover:bg-gray-50 ${result.doNotContact ? "bg-red-50/60" : ""}`}>
        <div className="flex items-center gap-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-gray-500">{result.kind.toUpperCase()}</span><span className="text-sm font-semibold text-gray-900"><Highlight text={result.title} query={query} /></span>{result.doNotContact ? <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">DO NOT CONTACT</span> : null}</div>
        <div className="mt-1 text-xs text-gray-500"><Highlight text={result.subtitle} query={query} /> · {result.status}</div>
      </Link>)}</div> : <p className="px-4 py-3 text-sm text-gray-500">No matching sales-memory records.</p>}
    </div> : null}
  </div>;
}
