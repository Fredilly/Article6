import React from 'react';
import type { GetServerSideProps } from 'next';
import StateCard from '@/components/StateCard';
import Leaderboard from '@/components/Leaderboard';
import { projects as fallbackProjects } from '@/data/projects';

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
  // any extra fields from fallbackProjects will be spread in
  [k: string]: any;
};

type Props = { items: Item[] };

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'http';
  const host  = req.headers.host;
  const base  = `${proto}://${host}`;

  try {
    const r = await fetch(`${base}/api/leaderboard`, { headers: { 'x-internal': '1' } });
    const j = await r.json();
    const apiItems: Item[] = Array.isArray(j.items) ? j.items : [];

    // merge api → fallback (so cards keep any extra fields like images, links, etc.)
    const map = Object.fromEntries(fallbackProjects.map(p => [p.slug, p]));
    const merged = apiItems.map(it => ({ ...(map[it.slug] || {}), ...it }));

    // include any fallback-only entries not in the sheet yet (nice for early demo)
    const missing = fallbackProjects.filter(p => !apiItems.some(it => it.slug === p.slug));

    return { props: { items: [...merged, ...missing] } };
  } catch {
    // hard fallback if API fails
    return { props: { items: fallbackProjects as Item[] } };
  }
};

export default function ProjectsPage({ items }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      <Leaderboard items={items as any} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
