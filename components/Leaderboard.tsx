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

function stageInfo(x: Item) {
  if (x.fera_signed) return { label: "FERA", weight: 3, cls: "bg-emerald-600" };
  if (x.mou_signed)  return { label: "MOU",  weight: 2, cls: "bg-blue-600" };
  if (x.los_signed)  return { label: "LOS",  weight: 1, cls: "bg-amber-600" };
  return { label: "Prospect", weight: 0, cls: "bg-zinc-500" };
}

function relTime(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60); if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24); if (d < 30) return d + "d ago";
  const mo = Math.floor(d / 30); if (mo < 12) return mo + "mo ago";
  return Math.floor(mo / 12) + "y ago";
}

function firstUrl(s?: string) {
  if (!s) return undefined;
  const parts = s.split(",").map(v => v.trim()).filter(Boolean);
  return parts[0];
}

function sortKey(x: Item) {
  const st = stageInfo(x).weight;
  const m30 = x.meetings_30d || 0;
  const total = x.meetings_count || 0;
  const recency = x.last_update_iso ? (1e6 - new Date(x.last_update_iso).getTime()) : 0; // newer first
  return -(st * 1_000_000_000 + m30 * 1_000_000 + total * 1_000 + recency);
}

export default function Leaderboard({ items, pollMs = 45000 }: Props) {
  const [live, setLive] = React.useState<Item[]>(() => Array.from(new Map(items.map(i => [i.slug, i])).values()));
  const [syncedAt, setSyncedAt] = React.useState<string | null>(null);

  // Client polling (keeps SSR fast; UI updates live)
  React.useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/leaderboard", { cache: "no-store" });
        const j = await r.json();
        const arr: Item[] = Array.isArray(j.items) ? j.items : [];
        const dedup = new Map(arr.map(i => [i.slug, i]));
        setLive(Array.from(dedup.values()));
        setSyncedAt(new Date().toISOString());
      } catch {}
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const data = React.useMemo(() => [...live].sort((a,b)=>sortKey(a)-sortKey(b)), [live]);

  return (
    <section className="rounded-2xl border bg-white/60 backdrop-blur p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
          <span className="relative inline-flex items-center">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-xs text-emerald-700 font-medium">live</span>
        </div>
        <span className="text-xs text-zinc-500">
          {syncedAt ? "Updated " + relTime(syncedAt) : "Auto-refresh ~" + Math.round(pollMs/1000) + "s"}
        </span>
      </div>

      {/* Mobile: compact cards */}
      <ul className="md:hidden space-y-2">
        {data.map((x) => {
          const st = stageInfo(x);
          const url = firstUrl(x.evidence_urls);
          return (
            <li key={x.slug} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{x.title || x.slug}</div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${st.cls}`}>{st.label}</span>
              </div>
              <div className="mt-1 text-xs text-zinc-600 flex items-center gap-2">
                <span>{x.meetings_30d ?? 0} in 30d</span>
                <span>•</span>
                <span>{x.meetings_count ?? 0} total</span>
                <span>•</span>
                <span>{relTime(x.last_update_iso)}</span>
                {url ? (<><span>•</span><a className="font-medium text-emerald-700 hover:underline" href={url} target="_blank" rel="noreferrer">Evidence</a></>) : null}
              </div>
            </li>
          );
        })}
        {data.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">No live data yet</li>}
      </ul>

      {/* Desktop: clear table of essentials */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-zinc-500 border-b">
            <tr>
              <th className="py-2 pr-4">State</th>
              <th className="py-2 pr-4">Stage</th>
              <th className="py-2 pr-4">Momentum (30d)</th>
              <th className="py-2 pr-4">Touchpoints</th>
              <th className="py-2 pr-4">Last update</th>
              <th className="py-2 pr-0">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {data.map((x) => {
              const st = stageInfo(x);
              const url = firstUrl(x.evidence_urls);
              return (
                <tr key={x.slug} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{x.title || x.slug}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${st.cls}`}>{st.label}</span>
                  </td>
                  <td className="py-3 pr-4">{x.meetings_30d ?? 0}</td>
                  <td className="py-3 pr-4">{x.meetings_count ?? 0}</td>
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
              <tr><td colSpan={6} className="py-8 text-center text-zinc-500">No live data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
