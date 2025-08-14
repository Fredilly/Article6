import React from "react";
import type { GetServerSideProps } from "next";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";

type Item = {
  slug: string;
  title: string;
  los_signed?: boolean;
  mou_signed?: boolean;
  fera_signed?: boolean;
  meetings_count?: number;
  meetings_30d?: number;
  last_update_iso?: string;
  evidence_urls?: string;
  [k: string]: any;
};

type Props = { projects: Item[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  const host  = req.headers.host;
  const base  = `${proto}://${host}`;

  try {
    const r = await fetch(`${base}/api/leaderboard`, { headers: { "x-internal": "1" } });
    const j = await r.json();
    const items: Item[] = Array.isArray(j.items) ? j.items : [];
    return { props: { projects: items } };
  } catch {
    return { props: { projects: [] } };
  }
};

export default function ProjectsPage({ projects }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      <Leaderboard items={projects as any} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {(projects as any[]).map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}

