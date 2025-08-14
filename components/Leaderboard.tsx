import * as React from "react";

type Item = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  evidence_urls?: string; // comma-separated
};

type Props = { items: Item[]; pollMs?: number };

const relTime = (iso?: string) => {
  if (!iso) return "—";
  const t = new Date(iso).getTime(); if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24); if (d < 30) return d + "d ago";
  const mo = Math.floor(d / 30); if (mo < 12) return mo + "mo ago";
  return Math.floor(mo / 12) + "y ago";
};

const phase = (x: Item) => x.fera_signed ? {t:"FERA", c:"bg-emerald-600"} :
                              x.mou_signed  ? {t:"MOU",  c:"bg-blue-600"} :
                              x.los_signed  ? {t:"LOS",  c:"bg-amber-600"} :
                                              {t:"Prospect", c:"bg-zinc-500"};

const firstUrl = (s?: string) => s?.split(",").map(x=>x.trim()).filter(Boolean)[0];

const sortKey = (x: Item) => {
  const rank = x.fera_signed ? 3 : x.mou_signed ? 2 : x.los_signed ? 1 : 0;
  return -(rank * 1_000_000 + (x.meetings_30d || 0) * 1_000 + (x.meetings_count || 0));
};

export default function Leaderboard({ items, pollMs = 45000 }: Props) {
  const [live, setLive] = React.useState<Item[]>(() => {
    const dedup = new Map(items.map(i => [i.slug, i]));
    return Array.from(dedup.values());
  });
  const [syncAt, setSyncAt] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/leaderboard");
        const j = await r.json();
        const arr: Item[] = Array.isArray(j.items) ? j.items : [];
        const dedup = new Map(arr.map(i => [i.slug, i]));    // live-only; no merge with static
        setLive(Array.from(dedup.values()));
        setSyncAt(new Date());
      } catch { /* ignore */ }
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const data = React.useMemo(() => [...live].sort((a,b)=>sortKey(a)-sortKey(b)), [live]);
  const feed = React.useMemo(() => {
    return [...live]
      .filter(i => i.last_update_iso)
      .sort((a,b)=>new Date(b.last_update_iso||0).getTime()-new Date(a.last_update_iso||0).getTime())
      .slice(0,6);
  }, [live]);

  return (
    <section className="rounded-2xl border bg-white/60 backdrop-blur p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
          <span className="relative inline-flex items-center">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-xs text-emerald-600 font-medium">live</span>
        </div>
        <span className="text-xs text-zinc-500">
          {syncAt ? `Updated ${relTime(syncAt.toISOString())}` : `Auto-refresh ~${Math.round(pollMs/1000)}s`}
        </span>
      </div>

      {/* Mobile-first compact list */}
      <ul className="md:hidden space-y-2">
        {data.map(x => {
          const ph = phase(x);
          const url = firstUrl(x.evidence_urls);
          return (
            <li key={x.slug} className="rounded-xl border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{x.title || x.slug}</div>
                <div className="text-xs text-zinc-500">{relTime(x.last_update_iso)}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium text-white ${ph.c}`}>{ph.t}</span>
                {typeof x.meetings_30d === "number" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-zinc-100 text-zinc-700">{x.meetings_30d} in 30d</span>
                )}
                {url ? (
                  <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-700 hover:underline">View</a>
                ) : null}
              </div>
            </li>
          );
        })}
        {data.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">No live data yet</li>}
      </ul>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-zinc-500 border-b">
            <tr>
              <th className="py-2 pr-4">State</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Meetings</th>
              <th className="py-2 pr-4">Last update</th>
              <th className="py-2 pr-0">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.map(x => {
              const ph = phase(x);
              const url = firstUrl(x.evidence_urls);
              return (
                <tr key={x.slug} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{x.title || x.slug}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${ph.c}`}>{ph.t}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{x.meetings_count ?? 0}</div>
                    <div className="text-xs text-zinc-500">{x.meetings_30d ?? 0} in 30d</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{relTime(x.last_update_iso)}</div>
                    <div className="text-xs text-zinc-500">{(x.last_update_iso || "—").slice(0,10)}</div>
                  </td>
                  <td className="py-3 pr-0">
                    {url ? <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-700 hover:underline">View</a> : <span className="text-xs text-zinc-400">—</span>}
                  </td>
                </tr>
              );
            })}
            {data.length === 0 && (
              <tr><td colSpan={5} className="py-8 text-center text-zinc-500">No live data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mini feed */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-600 mb-2">Live feed</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {feed.map(x => (
            <div key={x.slug} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{x.title || x.slug}</div>
                <span className="text-xs text-zinc-500">{relTime(x.last_update_iso)}</span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">
                {(x.fera_signed && "Framework Agreement activity") ||
                 (x.mou_signed && "MOU activity") ||
                 (x.los_signed && "LOS activity") || "Engagement updates"}
              </div>
            </div>
          ))}
          {feed.length === 0 && <div className="text-sm text-zinc-500">Updates will appear here.</div>}
        </div>
      </div>
    </section>
  );
}

