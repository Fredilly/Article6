import React from "react";
import type { GetServerSideProps } from "next";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects as localProjects } from "@/data/projects";

type ApiItem = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  evidence_urls?: string;
};

type CardItem = ApiItem & {
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

type Props = { live: ApiItem[]; cards: CardItem[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host  = req.headers.host;
  const base  = `${proto}://${host}`;

  try {
    const r = await fetch(`${base}/api/leaderboard`, { headers: { "x-internal": "1" } });
    const j = await r.json();
    const apiItems: ApiItem[] = Array.isArray(j.items) ? j.items : [];

    // Cards: merge live onto static extras (keep your rich content)
    const extrasMap = Object.fromEntries(localProjects.map(p => [p.slug, p]));
    const merged = apiItems.map(api => ({
      ...(extrasMap[api.slug] || {}),
      ...api,
      lastUpdateISO: api.last_update_iso || (extrasMap[api.slug]?.lastUpdateISO),
    }));
    // Include any static-only entries not yet in the sheet (so the 3 cards still show)
    const missing = localProjects
      .filter(p => !apiItems.some(a => a.slug === p.slug))
      .map(p => ({
        ...p,
        los_signed: false, mou_signed: false, fera_signed: false,
        meetings_count: 0, meetings_30d: 0,
        last_update_iso: p.lastUpdateISO,
      }));

    return { props: { live: apiItems, cards: [...merged, ...missing] } };
  } catch {
    // If API fails, show cards only (static)
    const fallback = localProjects.map(p => ({
      ...p,
      los_signed: false, mou_signed: false, fera_signed: false,
      meetings_count: 0, meetings_30d: 0,
      last_update_iso: p.lastUpdateISO,
    }));
    return { props: { live: [], cards: fallback } };
  }
};

export default function ProjectsPage({ live, cards }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      {/* Live-only leaderboard */}
      <Leaderboard items={live} pollMs={45000} />

      {/* Preserved rich project cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}

