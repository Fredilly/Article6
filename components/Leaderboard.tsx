import * as React from "react";
import { Trophy, FileSignature, CalendarClock } from "lucide-react";
import { sortByTotal, sortBySigned, sortByMeetings } from "@/lib/scoring";

type Item = {
  slug: string;
  title: string;
  meetings_count: number;
  meetings_30d: number;
  last_update_iso: string;
  score: number;                         // 0..100
  docs_signed: number;                   // 0..3
  stage_label: "Prospect" | "LOS" | "MOU" | "FERA";
  stage_rank: 0 | 1 | 2 | 3;
};
type Props = { items: Item[]; pollMs?: number };
type Tab = "total" | "signed" | "meetings";

const rel = (iso?: string) => {
  if (!iso) return "—";
  const t = new Date(iso).getTime(); if (isNaN(t)) return iso;
  const s = Math.floor((Date.now() - t)/1000);
  if (s < 60) return "just now";
  const m = Math.floor(s/60); if (m < 60) return m+"m ago";
  const h = Math.floor(m/60); if (h < 24) return h+"h ago";
  const d = Math.floor(h/24); if (d < 30) return d+"d ago";
  const mo = Math.floor(d/30); if (mo < 12) return mo+"mo ago";
  return Math.floor(mo/12)+"y ago";
};

function SegButton({ active, onClick, icon:Icon, children }:{active:boolean;onClick:()=>void;icon:any;children:React.ReactNode}) {
  return (
    <button onClick={onClick}
      className={"inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm border transition " +
        (active ? "bg-black text-white border-black" : "bg-white hover:bg-zinc-50 border-zinc-200 text-zinc-800")}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}

export default function Leaderboard({ items, pollMs = 40000 }: Props) {
  const [tab, setTab] = React.useState<Tab>("total");
  const [live, setLive] = React.useState<Item[]>(items || []);

  React.useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await fetch("/api/leaderboard", { cache: "no-store" });
        const j = await r.json();
        const arr: Item[] = Array.isArray(j.items) ? j.items : [];
        setLive(arr);
      } catch {}
    }, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const sorted = React.useMemo(() => {
    const copy = [...live];
    if (tab === "total")   return copy.sort(sortByTotal as any);
    if (tab === "signed")  return copy.sort(sortBySigned as any);
    return copy.sort(sortByMeetings as any);
  }, [live, tab]);

  return (
    <section className="rounded-2xl border bg-white/60 backdrop-blur p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight">Leaderboard</span>
          <span className="relative inline-flex items-center">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-xs text-emerald-700 font-medium">live</span>
        </div>

        {/* Segmented controls */}
        <div className="inline-flex items-center gap-2">
          <SegButton active={tab==="total"}   onClick={()=>setTab("total")}   icon={Trophy}>Total</SegButton>
          <SegButton active={tab==="signed"}  onClick={()=>setTab("signed")}  icon={FileSignature}>Signed</SegButton>
          <SegButton active={tab==="meetings"} onClick={()=>setTab("meetings")} icon={CalendarClock}>Meetings</SegButton>
        </div>
      </div>

      {/* Rows */}
      <ul className="space-y-3">
        {sorted.map((x, idx) => (
          <li key={x.slug} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-zinc-100 text-zinc-700 grid place-items-center text-sm font-medium">{idx+1}</div>
                <div className="text-lg font-semibold">{x.title || x.slug}</div>
              </div>

              {/* Right metric block switches with tab */}
              {tab === "total" && (
                <div className="flex items-center gap-3 w-full max-w-[560px]">
                  <div className="flex-1">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: Math.max(0, Math.min(100, x.score)) + "%" }} />
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">updated {rel(x.last_update_iso)}</div>
                  </div>
                  <div className="w-12 text-right text-lg font-bold">{x.score}</div>
                </div>
              )}

              {tab === "signed" && (
                <div className="flex items-center gap-3 w-full max-w-[560px]">
                  <div className="flex-1">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      {/* 3 equal segments for LOS/MOU/FERA */}
                      <div className="grid grid-cols-3 gap-[2px] h-2">
                        <div className={"h-2 rounded-l-full " + (x.stage_rank>=1 ? "bg-amber-500" : "bg-zinc-200")} />
                        <div className={(x.stage_rank>=2 ? "bg-blue-600" : "bg-zinc-200")} />
                        <div className={"h-2 rounded-r-full " + (x.stage_rank>=3 ? "bg-emerald-600" : "bg-zinc-200")} />
                      </div>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{x.docs_signed} / 3 signed</div>
                  </div>
                  <div className="w-12 text-right text-lg font-bold">{x.docs_signed}</div>
                </div>
              )}

              {tab === "meetings" && (
                <div className="flex items-center gap-3 w-full max-w-[560px]">
                  <div className="flex-1">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      {/* normalize bar width to max meetings_count in this set */}
                      <div
                        className="h-2 rounded-full bg-emerald-600"
                        style={{ width: (() => {
                          const max = Math.max(1, ...sorted.map(s => s.meetings_count||0));
                          return Math.min(100, ((x.meetings_count||0) / max) * 100) + "%";
                        })() }}
                      />
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">{x.meetings_count ?? 0} total • {x.meetings_30d ?? 0} in 30d</div>
                  </div>
                  <div className="w-12 text-right text-lg font-bold">{x.meetings_count ?? 0}</div>
                </div>
              )}
            </div>
          </li>
        ))}
        {sorted.length === 0 && <li className="text-sm text-zinc-500 text-center py-6">No live data yet</li>}
      </ul>
    </section>
  );
}
