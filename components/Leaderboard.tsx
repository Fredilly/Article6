import * as React from "react";
import { TrophyIcon, UsersIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";

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

const calcScore = (x: Item) => {
  const docs = (x.los_signed ? 1 : 0) + (x.mou_signed ? 1 : 0) + (x.fera_signed ? 1 : 0);
  return docs * 30 + (x.meetings_30d || 0) * 10;
};

function Metric({
  icon: Icon,
  label,
  value,
  max,
  color,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="rounded-lg border px-3 py-2 space-y-1">
      <div className="flex items-center space-x-1 text-xs font-medium">
        <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
        <span>{label}</span>
      </div>
      <div className="relative h-2 bg-zinc-200 rounded">
        <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
        <span className="absolute -top-5 right-0 text-xs font-semibold">{value}</span>
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <li className="rounded-xl border p-4 space-y-2 animate-pulse">
      <div className="h-4 w-40 bg-zinc-200 rounded" />
      <div className="h-2 w-full bg-zinc-200 rounded" />
    </li>
  );
}

export default function Leaderboard({ items, pollMs = 45000 }: Props) {
  const [live, setLive] = React.useState<Item[]>(() =>
    Array.from(new Map(items.map((i) => [i.slug, i])).values())
  );
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      const json = await res.json();
      if (Array.isArray(json.items)) {
        setLive((prev) => {
          const map = new Map(prev.map((i) => [i.slug, i]));
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
    return [...live].sort((a, b) => calcScore(b) - calcScore(a));
  }, [live]);

  const maxMeetings = React.useMemo(
    () => Math.max(1, ...data.map((i) => i.meetings_30d)),
    [data]
  );
  const maxScore = React.useMemo(
    () => Math.max(1, ...data.map((i) => calcScore(i))),
    [data]
  );

  return (
    <section className="rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm p-4">
      <h2 className="text-lg font-semibold tracking-tight mb-3">Leaderboard</h2>
      <ol className="space-y-4">
        {data.map((it) => {
          const docs =
            (it.los_signed ? 1 : 0) +
            (it.mou_signed ? 1 : 0) +
            (it.fera_signed ? 1 : 0);
          const score = calcScore(it);
          return (
            <li key={it.slug} className="rounded-xl border p-4 space-y-2 bg-white">
              <div className="font-medium truncate">{it.title}</div>
              <Metric
                icon={TrophyIcon}
                label="Overall"
                value={score}
                max={maxScore}
                color="bg-amber-500"
              />
              <Metric
                icon={UsersIcon}
                label="Meetings"
                value={it.meetings_30d}
                max={maxMeetings}
                color="bg-blue-500"
              />
              <Metric
                icon={DocumentCheckIcon}
                label="Signed"
                value={docs}
                max={3}
                color="bg-emerald-500"
              />
            </li>
          );
        })}
        {loading && data.length === 0 && [0, 1, 2].map((i) => <SkeletonRow key={i} />)}
      </ol>
    </section>
  );
}

