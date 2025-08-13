import React, { useMemo, useState } from "react";
import { Trophy } from "lucide-react";

type Item = {
  slug: string;
  title?: string;
  score: { total: number; docs: number; meetings: number; recency: number; momentum: number };
  meetings_count?: number;
  meetings_30d?: number;
};

export default function Leaderboard({ items }: { items: Item[] }) {
  const [sortKey, setSortKey] = useState<"total"|"docs"|"meetings"|"momentum">("total");
  const ranked = useMemo(() => {
    return [...items].sort((a,b) => (b.score[sortKey] ?? 0) - (a.score[sortKey] ?? 0));
  }, [items, sortKey]);

  return (
    <section className="rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" aria-hidden />
          <h2 className="text-lg font-semibold">Leaderboard</h2>
        </div>
        <div className="flex gap-2 text-sm">
          {["total","docs","meetings","momentum"].map(k => (
            <button key={k} onClick={() => setSortKey(k as any)}
              className={`px-2 py-1 rounded border ${sortKey===k ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}>
              {k === "total" ? "Overall" : k[0].toUpperCase()+k.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <ol className="space-y-2 max-h-[420px] overflow-auto pr-1">
        {ranked.map((p, i) => (
          <li key={p.slug}
              className="group flex items-center gap-3 rounded-lg border bg-white/80 hover:bg-white transition p-3"
              onMouseEnter={() => highlightCard(p.slug, true)}
              onMouseLeave={() => highlightCard(p.slug, false)}
          >
            <span className="w-6 text-sm font-bold text-gray-500">{i+1}</span>
            <span className="flex-1 font-medium truncate">{p.title || p.slug}</span>
            <div className="hidden sm:flex flex-1 items-center gap-2">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all duration-700 ease-out" style={{ width: `${Math.min(100, p.score.total/2.2)}%` }} />
              </div>
            </div>
            <span className="w-14 text-right text-sm tabular-nums">{Math.round(p.score.total)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function highlightCard(slug: string, on: boolean) {
  const el = document.querySelector(`[data-state-slug="${slug}"]`);
  if (!el) return;
  el.classList.toggle("ring-2", on);
  el.classList.toggle("ring-green-500", on);
  el.classList.toggle("ring-offset-2", on);
  el.classList.toggle("ring-offset-white", on);
}
