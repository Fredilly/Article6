import { useEffect, useMemo, useRef, useState } from "react";

export interface OrganizationFuzzyPickerItem {
  id: string;
  name: string;
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function editDistance(a: string, b: string) {
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
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function scoreMatch(name: string, query: string) {
  const haystack = normalize(name);
  const needle = normalize(query);
  if (!needle) return 0;
  if (haystack === needle) return 1000;
  if (haystack.startsWith(needle)) return 900 - (haystack.length - needle.length);
  const substringIndex = haystack.indexOf(needle);
  if (substringIndex >= 0) return 800 - substringIndex * 4;

  const words = haystack.split(" ");
  let best = -Infinity;
  for (const word of words) {
    if (word.startsWith(needle)) best = Math.max(best, 700 - (word.length - needle.length));
    const distance = editDistance(word, needle);
    const allowed = needle.length <= 4 ? 1 : needle.length <= 8 ? 2 : 3;
    if (distance <= allowed) best = Math.max(best, 600 - distance * 80 - Math.abs(word.length - needle.length) * 5);
  }

  let cursor = 0;
  let gaps = 0;
  for (const char of needle) {
    const found = haystack.indexOf(char, cursor);
    if (found < 0) return best;
    gaps += found - cursor;
    cursor = found + 1;
  }
  return Math.max(best, 400 - gaps * 8 - (haystack.length - needle.length));
}

export default function OrganizationFuzzyPicker({ items, value, onChange }: { items: OrganizationFuzzyPickerItem[]; value: string; onChange: (id: string) => void }) {
  const selected = items.find((item) => item.id === value);
  const [query, setQuery] = useState(selected?.name || "");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setQuery(selected?.name || "");
  }, [selected?.name, open]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const results = useMemo(() => {
    const needle = query.trim();
    if (!needle) return items.slice(0, 8);
    return items
      .map((item) => ({ item, score: scoreMatch(item.name, needle) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .slice(0, 10)
      .map((result) => result.item);
  }, [items, query]);

  return <div ref={rootRef} className="relative">
    <input
      value={query}
      onFocus={() => { setOpen(true); if (selected && query === selected.name) setQuery(""); }}
      onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
      autoComplete="off"
      placeholder="Search organization…"
      aria-label="Search organization"
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100"
    />
    {open ? <div className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
      {results.length ? results.map((item) => <button
        key={item.id}
        type="button"
        onClick={() => { onChange(item.id); setQuery(item.name); setOpen(false); }}
        className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${item.id === value ? "bg-forest-50 font-medium" : ""}`}
      >{item.name}</button>) : <div className="px-3 py-2 text-sm text-gray-500">No matching organizations.</div>}
    </div> : null}
  </div>;
}
