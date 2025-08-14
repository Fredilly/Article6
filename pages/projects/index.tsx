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
  last_update_iso?: string;   // snake_case from Sheet/API
  evidence_urls?: string;
  [k: string]: any;
};

type UIProject = ApiItem & {
  // plus local extras that StateCard might use
  epithet?: string;
  summary?: string;
  status?: "pending" | "active" | "discussion" | string;
  tags?: string[];
  updatedAt?: string;
  ctaLabel?: string;
  progress?: number;
  activityScore?: number;
  lastUpdateISO?: string; // camelCase version for components
};

type Props = { projects: UIProject[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host  = req.headers.host;
  const base  = `${proto}://${host}`;

  try {
    const r = await fetch(`${base}/api/leaderboard`, { headers: { "x-internal": "1" } });
    const j = await r.json();
    const apiItems: ApiItem[] = Array.isArray(j.items) ? j.items : [];

    // Map static extras by slug (epithet, summary, progress, etc.)
    const extrasMap = Object.fromEntries(localProjects.map((p) => [p.slug, p]));

    // Merge: API overrides where available; keep extras; normalize lastUpdateISO
    const merged: UIProject[] = apiItems.map((api) => {
      const extra = extrasMap[api.slug] || {};
      return {
        ...extra,
        ...api,
        // provide camelCase for components that expect it
        lastUpdateISO: api.last_update_iso || extra.lastUpdateISO,
      };
    });

    // Include any static-only entries not yet in the sheet (so cards still show)
    const missing: UIProject[] = localProjects
      .filter((p) => !apiItems.some((a) => a.slug === p.slug))
      .map((p) => ({
        ...p,
        // ensure required fields exist for Leaderboard even if static-only
        los_signed: false,
        mou_signed: false,
        fera_signed: false,
        meetings_count: 0,
        meetings_30d: 0,
        last_update_iso: p.lastUpdateISO,
      }));

    return { props: { projects: [...merged, ...missing] } };
  } catch {
    // Hard fallback to static extras only
    const fallback: UIProject[] = localProjects.map((p) => ({
      ...p,
      los_signed: false,
      mou_signed: false,
      fera_signed: false,
      meetings_count: 0,
      meetings_30d: 0,
      last_update_iso: p.lastUpdateISO,
    }));
    return { props: { projects: fallback } };
  }
};

export default function ProjectsPage({ projects }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      {/* Leaderboard first */}
      <Leaderboard items={projects as any} />

      {/* Then the cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
