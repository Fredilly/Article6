import React from "react";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects } from "@/data/projects";
import { getLeaderboard, type LiveItem } from "@/lib/leaderboard";

type Props = { live: LiveItem[] };

export default function ProjectsPage({ live }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      <Leaderboard items={live} pollMs={45000} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  const live = await getLeaderboard();
  return { props: { live } };
}
