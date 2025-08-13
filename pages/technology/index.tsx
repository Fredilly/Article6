import React from "react";
import TechnologyCard from "@/components/TechnologyCard";
import { technologies } from "@/data/technology";

export default function TechnologyPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Technology</h1>
        <p className="text-muted-foreground">The stack behind our MRV, data, and payments.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {technologies.map((t) => (
          <TechnologyCard key={t.slug} {...t} />
        ))}
      </div>
    </main>
  );
}
