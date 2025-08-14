import React from "react";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects } from "@/data/projects";
import { GetServerSideProps } from "next";
import { getLeaderboard } from "@/lib/leaderboard";

type Props = { live: any[]; debug?: string };

export default function ProjectsPage({ live, debug }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      {debug && (
        <div className="text-xs text-red-600">debug: {debug}</div>
      )}

      <Leaderboard items={live.length ? (live as any) : (projects as any)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const live = await getLeaderboard();
    return { props: { live } };
  } catch (e: any) {
    return { props: { live: [], debug: e?.message || "fetch_failed" } };
  }
};
