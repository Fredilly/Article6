import React from "react";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects } from "@/data/projects";
import { getLeaderboard } from "@/lib/leaderboard";
import { enrich, sortByTotal } from "@/lib/scoring";

export async function getServerSideProps() {
  const live = (await getLeaderboard()).map(enrich).sort(sortByTotal);
  return { props: { live } };
}

export default function ProjectsPage({ live }: { live: any[] }) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      <Leaderboard items={live as any} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
