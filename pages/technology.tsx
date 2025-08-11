import React from 'react';
import Link from "next/link";
import TechPill from "@/components/tech/TechPill";
import StatCard from "@/components/tech/StatCard";
import ArchitectureDiagram from "@/components/tech/ArchitectureDiagram";

export default function Technology() {
  return (
    <main className="mx-auto max-w-6xl px-4 md:px-6 lg:px-8 py-12 md:py-16">
      {/* Hero */}
      <section className="mb-10">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">AI MRV‑as‑a‑Service</h1>
        <p className="mt-4 text-gray-600 max-w-2xl">
          Verifiable carbon data for Nigerian states—delivered in days, not months. Our pipeline blends remote sensing,
          optional field telemetry, and a human‑in‑the‑loop review to produce audit‑ready outputs.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <TechPill>Open‑source friendly</TechPill>
          <TechPill>Remote‑sensing first</TechPill>
          <TechPill>Human‑in‑the‑loop QA</TechPill>
          <TechPill>HubSpot‑native handoff</TechPill>
        </div>
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard label="Typical reply" value="48h" />
        <StatCard label="Auto‑fill coverage" value="≈80%" note="Questionnaire items" />
        <StatCard label="Update cadence" value="Monthly" note="RS tiles / KPIs" />
        <StatCard label="Focus" value="Nigeria" />
      </section>

      {/* Architecture */}
      <section className="mb-12">
        <h2 className="text-xl md:text-2xl font-semibold">How it works</h2>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Data flows from satellite imagery and documents into a vectorized knowledge base. An LLM reasons with the most
          relevant evidence and our analysts finalize outputs. Deals and contacts sync automatically to HubSpot.
        </p>
        <div className="mt-5"><ArchitectureDiagram /></div>
      </section>

      {/* Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h3 className="font-medium text-lg">Remote Sensing</h3>
          <p className="mt-2 text-sm text-gray-700">10 m Sentinel‑2 by default; optional higher‑res for buyer audits. NDVI, biomass deltas, and change detection overlayed on project maps.</p>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h3 className="font-medium text-lg">Optional IoT Telemetry</h3>
          <p className="mt-2 text-sm text-gray-700">Field gateways record hourly water level (±1 cm) and soil moisture (±2%). Devices buffer offline and sync via cellular.</p>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h3 className="font-medium text-lg">Open‑Source Pipeline</h3>
          <p className="mt-2 text-sm text-gray-700">Postgres + pgvector, reproducible notebooks, and portable SDKs. Your data stays yours; our stack avoids lock‑in.</p>
          <p className="mt-1 text-xs text-gray-500">We contribute patches upstream and publish example notebooks.</p>
        </div>
      </section>

      {/* Security & Ops */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h3 className="font-medium text-lg">Security by Design</h3>
          <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1.5">
            <li>Row‑level security; least‑privilege service roles.</li>
            <li>Region controls (EU hosting available when required).</li>
            <li>Comprehensive audit logs & change history.</li>
          </ul>
        </div>
        <div className="rounded-2xl border bg-white shadow-sm p-6">
          <h3 className="font-medium text-lg">APIs & SDKs</h3>
          <ul className="mt-2 text-sm text-gray-700 list-disc pl-5 space-y-1.5">
            <li>Answer API (RAG) with citation guarantees.</li>
            <li>Tiles API for NDVI/biomass overlays.</li>
            <li>Events webhook to your CRM or data warehouse.</li>
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl border bg-white shadow-sm p-6 text-center">
        <h3 className="text-lg md:text-xl font-medium">Ready to see it in action?</h3>
        <p className="mt-2 text-sm text-gray-700">We’ll spin a pilot on your project area and share a trust page with live overlays.</p>
        <Link href="/contact" className="inline-block mt-4 rounded-xl px-5 py-3 border bg-black text-white">Start a pilot</Link>
      </section>
    </main>
  );
}
