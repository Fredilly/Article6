import * as React from "react";

type Item = {
  slug: string;
  title: string;
  epithet?: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  lastUpdateISO?: string;
  evidence_urls?: string;
  progress?: number;
  activityScore?: number;
};

type Props = {
  items: Item[];
  pollMs?: number; // auto-refresh interval
};

function phaseOf(x: Item) {
  if (x.fera_signed) return { label: "FERA", tone: "bg-emerald-600" };
  if (x.mou_signed)  return { label: "MOU",  tone: "bg-blue-600" };
  if (x.los_signed)  return { label: "LOS",  tone: "bg-amber-600" };
  return { label: "Prospect", tone: "bg-zinc-500" };
}

function relativeTime(iso?: string) {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "h ago";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "d ago";
  const mo = Math.floor(d / 30);
  if (mo < 12) return mo + "mo ago";
  const y = Math.floor(mo / 12);
  return y + "y ago";
}

function firstUrl(list?: string) {
  if (!list) return undefined;
  const parts = list.split(",").map(s => s.trim()).filter(Boolean);
  return parts[0];
}

function sortWeight(x: Item) {
  // FERA > MOU > LOS > Prospect, then meetings_30d desc, then total meetings desc
  const rank = x.fera_signed ? 3 : x.mou_signed ? 2 : x.los_signed ? 1 : 0;
  return -(rank * 1_000_000 + (x.meetings_30d || 0) * 1_000 + (x.meetings_count || 0));
}

export default function Leaderboard({ items: initial, pollMs = 45000 }: Props) {
  const [items, setItems] = React.useState<Item[]>(initial || []);

  // Auto-refresh (client-only). Keeps extras (epithet/progress) from current state.
  React.useEffect(() => {
    let id: any;
    async function tick() {
      try {
        const r = await fetch("/api/leaderboard");
        const j = await r.json();
        const live: Item[] = Array.isArray(j.items) ? j.items : [];
        const map = new Map(items.map(i => [i.slug, i]));
        const merged = live.map(l => ({ ...(map.get(l.slug) || {}), ...l, lastUpdateISO: l.last_update_iso || (map.get(l.slug)?.lastUpdateISO) }));
        setItems(prev => {
          const prevMap = new Map(prev.map(p => [p.slug, p]));
          const out = live.map(l => ({ ...(prevMap.get(l.slug) || {}), ...l, lastUpdateISO: l.last_update_iso || (prevMap.get(l.slug)?.lastUpdateISO) }));
          return out;
        });
      } catch {
        // ignore fetch errors to avoid UI flicker
      }
    }
    id = setInterval(tick, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  const sorted = React.useMemo(() => [...items].sort((a, b) => sortWeight(a) - sortWeight(b)), [items]);

  const feed = React.useMemo(() => {
    return [...items]
      .filter(i => i.last_update_iso || i.lastUpdateISO)
      .sort((a, b) => {
        const ta = new Date(a.last_update_iso || a.lastUpdateISO || 0).getTime();
        const tb = new Date(b.last_update_iso || b.lastUpdateISO || 0).getTime();
        return tb - ta;
      })
      .slice(0, 6);
  }, [items]);

  return (
    <section className="rounded-2xl border bg-white/50 backdrop-blur p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
          <span className="relative inline-flex items-center">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-xs text-emerald-600 font-medium">live</span>
        </div>
        <span className="text-xs text-muted-foreground">Auto-refresh ~{Math.round(pollMs/1000)}s</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
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
            {sorted.map((x) => {
              const phase = phaseOf(x);
              const evidence = firstUrl(x.evidence_urls);
              return (
                <tr key={x.slug} className="border-b last:border-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{x.title || x.slug}</div>
                    {x.epithet ? <div className="text-xs text-zinc-500">{x.epithet}</div> : null}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="inline-flex items-center gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${phase.tone}`}>{phase.label}</span>
                      {x.los_signed ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">LOS</span> : null}
                      {x.mou_signed ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">MOU</span> : null}
                      {x.fera_signed ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">FERA</span> : null}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{x.meetings_count ?? 0}</div>
                    <div className="text-xs text-zinc-500">{x.meetings_30d ?? 0} in 30d</div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="font-medium">{relativeTime(x.last_update_iso || x.lastUpdateISO)}</div>
                    <div className="text-xs text-zinc-500">{(x.last_update_iso || x.lastUpdateISO || "—").slice(0, 10)}</div>
                  </td>
                  <td className="py-3 pr-0">
                    {evidence ? (
                      <a href={evidence} target="_blank" rel="noreferrer" className="text-xs font-medium text-emerald-700 hover:underline">
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-500">No live data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mini live feed */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-zinc-600 mb-2">Live feed</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {feed.map((x) => (
            <div key={x.slug} className="rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">{x.title || x.slug}</div>
                <span className="text-xs text-zinc-500">{relativeTime(x.last_update_iso || x.lastUpdateISO)}</span>
              </div>
              <div className="text-xs text-zinc-600 mt-1">
                {x.fera_signed ? "Framework Agreement progress" :
                 x.mou_signed  ? "MOU activity" :
                 x.los_signed  ? "LOS activity" :
                                 "Engagement updates"}
              </div>
            </div>
          ))}
          {feed.length === 0 && (
            <div className="text-sm text-zinc-500">Updates will appear here as timestamps land in the sheet.</div>
          )}
        </div>
      </div>
    </section>
  );
}

