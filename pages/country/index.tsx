import React from "react";
import NigeriaMap from "@/components/NigeriaMap";

export default function CountryPage() {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Nigeria Overview</h1>
        <p className="text-muted-foreground">States we’re actively engaging.</p>
      </header>
      <section className="rounded-2xl border bg-white p-4">
        <NigeriaMap active={["niger", "kwara", "plateau"]} />
      </section>
    </main>
  );
}
