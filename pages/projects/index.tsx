import React from "react";
import type { GetServerSideProps } from "next";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { getLeaderboard, type LiveItem } from "@/lib/leaderboard";
import { projects as localProjects } from "@/data/projects";

type CardItem = LiveItem & {
  epithet?: string;
  summary?: string;
  status?: string;
  tags?: string[];
  updatedAt?: string;
  ctaLabel?: string;
  progress?: number;
  activityScore?: number;
  lastUpdateISO?: string;
};

type Props = { live: LiveItem[]; cards: CardItem[]; debug?: string };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const live = await getLeaderboard(); // direct Sheets read on server
    // merge live onto static extras for cards
    const map = Object.fromEntries(localProjects.map(p => [p.slug, p]));
    const merged = live.map(api => ({ ...(map[api.slug] || {}), ...api, lastUpdateISO: api.last_update_iso || (map[api.slug]?.lastUpdateISO) }));
    const missing = localProjects
      .filter(p => !live.some(a => a.slug === p.slug))
      .map(p => ({ ...p, los_signed:false, mou_signed:false, fera_signed:false, meetings_count:0, meetings_30d:0, last_update_iso:p.lastUpdateISO }));
    return { props: { live, cards: [...merged, ...missing] } };
  } catch (e: any) {
    // show a tiny debug banner in Preview if something fails
    const fallback = localProjects.map(p => ({ ...p, los_signed:false, mou_signed:false, fera_signed:false, meetings_count:0, meetings_30d:0, last_update_iso:p.lastUpdateISO }));
    return { props: { live: [], cards: fallback, debug: e?.message || "unknown_error" } };
  }
};

export default function ProjectsPage({ live, cards, debug }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      {process.env.NEXT_PUBLIC_VERCEL_ENV !== "production" && debug && (
        <div className="text-xs rounded-lg border border-amber-300 bg-amber-50 p-2 text-amber-800">
          Debug: {debug}
        </div>
      )}

      <Leaderboard items={live} pollMs={45000} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
