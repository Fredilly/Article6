import React from "react";
import type { GetServerSideProps } from "next";
import StateCard from "@/components/StateCard";
import Leaderboard from "@/components/Leaderboard";
import { projects } from "@/data/projects";
import { getLeaderboard } from "@/lib/leaderboard";

interface Props {
  items: any[];
  debug?: string;
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const live = await getLeaderboard();
    return { props: { items: live } };
  } catch (e: any) {
    return { props: { items: projects as any, debug: e?.message || "fetch_failed" } };
  }
};

export default function ProjectsPage({ items, debug }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      {debug && process.env.NODE_ENV !== "production" && (
        <p className="text-xs text-red-500">debug: {debug}</p>
      )}
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
        <p className="text-muted-foreground">Active and upcoming state engagements.</p>
      </header>

      <Leaderboard items={items as any} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <StateCard key={p.slug} {...p} />
        ))}
      </div>
    </main>
  );
}
