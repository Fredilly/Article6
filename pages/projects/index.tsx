import React from "react";
import type { GetServerSideProps } from "next";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import Breadcrumb from "@/components/Breadcrumb";
import { getLeaderboard, type LiveItem } from "@/lib/leaderboard";
import { enrich, sortByTotal, type ScoredItem } from "@/lib/scoring";
import { projects as localProjects } from "@/data/projects";

interface ProjectEntry {
  slug: string;
  title: string;
  epithet?: string;
  summary?: string;
  status?: "pending" | "active" | "discussion" | string;
  tags?: string[];
  updatedAt?: string;
  ctaLabel?: string;
  progress: number;
  activityScore?: number;
  lastUpdateISO?: string;
}

type CardItem = LiveItem & Partial<ProjectEntry>;

type Props = { live: ScoredItem[]; cards: CardItem[]; debug?: string };

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const live: ScoredItem[] = (await getLeaderboard()).map(enrich).sort(sortByTotal); // strict LIVE
    const extras = new Map<string, ProjectEntry>(localProjects.map(p => [p.slug, p]));
    const merged: CardItem[] = live.map((api): CardItem => {
      const extra = extras.get(api.slug);
      return {
        ...(extra ?? {}),
        ...api,
        lastUpdateISO: api.last_update_iso || extra?.lastUpdateISO,
      };
    });
    const missing: CardItem[] = localProjects
      .filter(p => !live.some(a => a.slug === p.slug))
      .map((p): CardItem => ({
        ...p,
        los_signed: false,
        mou_signed: false,
        fera_signed: false,
        meetings_count: 0,
        meetings_30d: 0,
        last_update_iso: p.lastUpdateISO || "",
        evidence_urls: "",
      }));
    return { props: { live, cards: [...merged, ...missing] } };
  } catch (e: any) {
    const fallback: CardItem[] = localProjects.map((p): CardItem => ({
      ...p,
      los_signed: false,
      mou_signed: false,
      fera_signed: false,
      meetings_count: 0,
      meetings_30d: 0,
      last_update_iso: p.lastUpdateISO || "",
      evidence_urls: "",
    }));
    return { props: { live: [], cards: fallback, debug: e?.message || "unknown_error" } };
  }
};

export default function ProjectsPage({ live, cards, debug }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <Breadcrumb
        segments={[
          { href: "/", label: "Home" },
          { href: "/countries", label: "Countries" },
          { href: "/country", label: "Nigeria" },
          { href: "/projects", label: "Projects" },
        ]}
      />
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
          <StateCard key={p.slug} {...p} href={`/projects/nigeria/states/${p.slug}`} />
        ))}
      </div>
    </main>
  );
}
