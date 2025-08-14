import * as React from "react";

        type Item = {
          slug: string;
          title: string;
          los_signed?: boolean;
          mou_signed?: boolean;
          fera_signed?: boolean;
          meetings_30d?: number;
          last_update_iso?: string;
        };

        type Props = { items: Item[]; pollMs?: number };

        const stage = (x: Item) =>
          x.fera_signed ? { t: "FERA", c: "bg-emerald-600" } :
          x.mou_signed  ? { t: "MOU",  c: "bg-blue-600" } :
          x.los_signed  ? { t: "LOS",  c: "bg-amber-600" } :
                          { t: "Prospect", c: "bg-zinc-500" };

        const rel = (iso?: string) => {
          if (!iso) return "—";
          const ts = new Date(iso).getTime(); if (isNaN(ts)) return iso;
          const s = Math.floor((Date.now() - ts)/1000);
          if (s < 60) return "just now";
          const m = Math.floor(s/60); if (m < 60) return m+"m ago";
          const h = Math.floor(m/60); if (h < 24) return h+"h ago";
          const d = Math.floor(h/24); if (d < 30) return d+"d ago";
          const mo = Math.floor(d/30); if (mo < 12) return mo+"mo ago";
          return Math.floor(mo/12)+"y ago";
        };

        const sortKey = (x: Item) => {
          const rank = x.fera_signed ? 3 : x.mou_signed ? 2 : x.los_signed ? 1 : 0;
          return -(rank*1_000_000 + (x.meetings_30d||0)*1_000 + (x.last_update_iso ? new Date(x.last_update_iso).getTime() : 0));
        };

        export default function Leaderboard({ items, pollMs = 45000 }: Props) {
          const [live, setLive] = React.useState<Item[]>(() => Array.from(new Map(items.map(i=>[i.slug,i])).values()));

          React.useEffect(() => {
            const id = setInterval(async () => {
              try {
                const r = await fetch("/api/leaderboard", { cache: "no-store" });
                const j = await r.json();
                const arr: Item[] = Array.isArray(j.items) ? j.items : [];
                setLive(Array.from(new Map(arr.map(i=>[i.slug,i])).values())); // strictly live, no static merge
              } catch {}
            }, pollMs);
            return () => clearInterval(id);
          }, [pollMs]);

          const data = React.useMemo(() => [...live].sort((a,b)=>sortKey(a)-sortKey(b)), [live]);

          return (
            <section className="rounded-2xl border bg-white/60 backdrop-blur p-4 md:p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold tracking-tight">Leaderboard</h2>
                <span className="relative inline-flex items-center">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                </span>
                <span className="text-xs text-emerald-700 font-medium">live</span>
              </div>

              {/* Mobile: 3 metrics compact */}
              <ul className="md:hidden space-y-2">
                {data.map((x) => {
                  const st = stage(x);
                  return (
                    <li key={x.slug} className="rounded-xl border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{x.title || x.slug}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] text-white ${st.c}`}>{st.t}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 flex items-center gap-2">
                        <span>{x.meetings_30d ?? 0} in 30d</span>
                        <span>•</span>
                        <span>{rel(x.last_update_iso)}</span>
                      </div>
                    </li>
                  );
                })}
                {data.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">No live data yet</li>}
              </ul>

              {/* Desktop: 3 columns only */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-zinc-500 border-b">
                    <tr>
                      <th className="py-2 pr-4">State</th>
                      <th className="py-2 pr-4">Stage</th>
                      <th className="py-2 pr-4">Momentum (30d)</th>
                      <th className="py-2 pr-4">Last update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((x) => {
                      const st = stage(x);
                      return (
                        <tr key={x.slug} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{x.title || x.slug}</td>
                          <td className="py-3 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${st.c}`}>{st.t}</span>
                          </td>
                          <td className="py-3 pr-4">{x.meetings_30d ?? 0}</td>
                          <td className="py-3 pr-4">
                            <div className="font-medium">{rel(x.last_update_iso)}</div>
                            <div className="text-xs text-zinc-500">{(x.last_update_iso || "—").slice(0,10)}</div>
                          </td>
                        </tr>
                      );
                    })}
                    {data.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-zinc-500">No live data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          );
        }

