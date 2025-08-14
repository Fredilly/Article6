import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Sparkles } from "lucide-react";
import { computeScore } from "@/lib/score";

type Item = {
  slug: string;
  title: string;
  progress?: number;
  activityScore?: number;
  lastUpdateISO?: string;
};

export default function Leaderboard({ items: initialItems, pollMs = 0 }: { items: Item[]; pollMs?: number }) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [sortKey, setSortKey] = useState<"score"|"progress"|"activity">("score");

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  useEffect(() => {
    if (!pollMs) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const json = await res.json();
        if (Array.isArray(json.items)) setItems(json.items);
      } catch (e) {
        // ignore
      }
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const ranked = useMemo(() => {
    const arr = items.map(i => ({...i, score: computeScore(i)}));
    arr.sort((a,b) => {
      if (sortKey === "progress") return (b.progress ?? 0) - (a.progress ?? 0);
      if (sortKey === "activity") return (b.activityScore ?? 0) - (a.activityScore ?? 0);
      return (b.score ?? 0) - (a.score ?? 0);
    });
    return arr;
  }, [items, sortKey]);

  const topSlug = ranked[0]?.slug;

  return (
    <section className="rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" aria-hidden />
          <h2 className="text-lg font-semibold tracking-tight">Leaderboard</h2>
          {topSlug ? <span className="ml-2 inline-flex items-center text-xs text-green-700 bg-green-100 rounded px-2 py-0.5">
            <Sparkles className="w-3 h-3 mr-1" /> {ranked[0].title}
          </span> : null}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => setSortKey("score")}
            className={`px-2 py-1 rounded border ${sortKey==="score"?"bg-black text-white":"bg-white hover:bg-gray-50"}`}>
            Overall
          </button>
          <button onClick={() => setSortKey("progress")}
            className={`px-2 py-1 rounded border ${sortKey==="progress"?"bg-black text-white":"bg-white hover:bg-gray-50"}`}>
            Progress
          </button>
          <button onClick={() => setSortKey("activity")}
            className={`px-2 py-1 rounded border ${sortKey==="activity"?"bg-black text-white":"bg-white hover:bg-gray-50"}`}>
            Activity
          </button>
        </div>
      </div>

      <ol className="space-y-2 max-h-[420px] overflow-auto pr-1">
        {ranked.map((p, idx) => {
          const borderColor =
            idx === 0 ? "border-yellow-200" :
            idx === 1 ? "border-gray-200" :
            idx === 2 ? "border-amber-200" :
            "border-gray-200";
          return (
            <li key={p.slug}
                data-slug={p.slug}
                className={`group flex items-center gap-3 rounded-lg border ${borderColor} bg-white/80 hover:bg-white hover:-translate-y-0.5 transition p-3`}
                onMouseEnter={() => highlightCard(p.slug, true)}
                onMouseLeave={() => highlightCard(p.slug, false)}
            >
              <span className="w-6 text-sm font-bold text-gray-500">{idx+1}</span>
              <span className="flex-1 font-medium truncate">{p.title}</span>

              {/* Progress bar */}
              <div className="hidden sm:flex flex-1 items-center gap-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all duration-700 ease-out"
                       style={{ width: `${Math.max(0, Math.min(100, p.progress ?? 0))}%` }} />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-gray-500">{Math.round(p.progress ?? 0)}%</span>
              </div>

              {/* Scores */}
              <div className="w-24 text-right">
                <span className="inline-flex items-center justify-end text-sm font-semibold tabular-nums">
                  {sortKey==="progress" ? Math.round(p.progress ?? 0)
                   : sortKey==="activity" ? Math.round(p.activityScore ?? 0)
                   : Math.round(p.score ?? 0)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-2 text-xs text-gray-500">
        Overall score weights progress (60%), activity (30%), and recency (10%).
      </p>
    </section>
  );
}

// Simple highlight hook-up: add ring to matching StateCard in the grid
function highlightCard(slug: string, on: boolean) {
  const el = document.querySelector(`[data-state-slug="${slug}"]`);
  if (!el) return;
  el.classList.toggle("ring-2", on);
  el.classList.toggle("ring-green-500", on);
  el.classList.toggle("ring-offset-2", on);
  el.classList.toggle("ring-offset-white", on);
}
