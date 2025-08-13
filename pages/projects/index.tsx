import React from "react";
import useSWR from "swr";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects } from "@/data/projects";

const fetcher = (u: string) => fetch(u).then(r => r.json());

export default function ProjectsPage() {
  const { data } = useSWR("/api/leaderboard", fetcher, { refreshInterval: 300000 });
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      {data?.items ? <Leaderboard items={data.items} /> : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
