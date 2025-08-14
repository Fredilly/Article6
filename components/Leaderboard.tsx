import * as React from "react";

type Item = {
  slug: string;
  title: string;
  los_signed: boolean;
  mou_signed: boolean;
  fera_signed: boolean;
  meetings_30d: number;
  last_update_iso: string;
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

function SkeletonRow() {
  return (
    <li className="rounded-xl border p-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-40 bg-zinc-200 rounded" />
        <div className="h-5 w-12 bg-zinc-200 rounded-full" />
      </div>
      <div className="mt-2 h-3 w-56 bg-zinc-200 rounded" />
    </li>
  );
}

export default function Leaderboard({ items, pollMs = 45000 }: Props) {
  const [live, setLive] = React.useState<Item[]>(() => Array.from(new Map(items.map(i=>[i.slug,i])).values()));
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.items)) {
        setLive(prev => {
          const map = new Map(prev.map(i=>[i.slug,i]));
          for (const it of json.items) map.set(it.slug, it);
          return Array.from(map.values());
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [pollMs, refresh]);

  const data = React.useMemo(() => {
    return [...live].sort((a,b)=>sortKey(a)-sortKey(b));
  }, [live]);

  return (
    <section className="rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm p-4">
      <h2 className="text-lg font-semibold tracking-tight mb-3">Leaderboard</h2>
      <ol className="space-y-2">
        {data.map(it => (
          <li key={it.slug} className="rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium truncate pr-2">{it.title}</span>
              <span className={`text-xs text-white px-2 py-0.5 rounded-full ${stage(it).c}`}>{stage(it).t}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-zinc-600">
              <span>{it.meetings_30d} meetings/30d</span>
              <span>{rel(it.last_update_iso)}</span>
            </div>
          </li>
        ))}
        {loading && data.length === 0 && [0,1,2].map(i => <SkeletonRow key={i} />)}
      </ol>
    </section>
  );
}
