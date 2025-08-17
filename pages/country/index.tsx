import React, { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import NigeriaMap from "@/components/NigeriaMap";
import Breadcrumb from "@/components/Breadcrumb";
import { STATES, ACTIVE, PIPELINE, META, SLUGS } from "@/data/country";

export default function CountryPage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "pipeline" | "active">("all");

  const pool = tab === "pipeline" ? PIPELINE : tab === "active" ? ACTIVE : SLUGS;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return pool;
    return pool.filter((slug) => STATES[slug].name.toLowerCase().includes(needle));
  }, [q, pool]);

  const active = ACTIVE;
  const pipeline = PIPELINE;

  const getHref = (slug: string) =>
    active.includes(slug) || pipeline.includes(slug)
      ? `/projects/nigeria/states/${slug}`
      : `/projects/nigeria/states/${slug}/facts`;

  return (
    <>
      <Head>
        <title>Nigeria Overview | Article6</title>
        <meta
          name="description"
          content="States we're actively engaging in Nigeria."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: "/" },
                { "@type": "ListItem", position: 2, name: "Nigeria Overview", item: "/country" },
              ],
            }),
          }}
        />
      </Head>
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <Breadcrumb
          segments={[
            { href: "/", label: "Home" },
            { href: "/countries", label: "Countries" },
            { href: "/country", label: "Nigeria" },
          ]}
        />
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Nigeria Overview</h1>
          <p className="text-muted-foreground">States we’re actively engaging.</p>
        </header>

        {/* Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 rounded-xl border bg-white p-1 w-full md:w-auto">
            {(["all", "pipeline", "active"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  tab === k ? "bg-black text-white" : "hover:bg-muted"
                }`}
              >
                {k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search state…"
            className="w-full md:w-64 rounded-xl border px-3 py-2 text-sm"
            aria-label="Search state"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map card */}
          <section className="lg:col-span-2 rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Interactive map</span>
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[#16A34A]" /> Active</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[#FBBF24]" /> Pipeline</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-[#E5E7EB]" /> Other</span>
              </div>
            </div>
            <NigeriaMap active={active} pipeline={pipeline} />
          </section>

          {/* Right: State list */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border bg-white p-4 space-y-3 max-h-[70vh] overflow-auto">
              {filtered.map((slug) => (
                <Link
                  key={slug}
                  href={getHref(slug)}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 hover:bg-muted min-h-12"
                >
                  <div className="text-sm">
                    <div className="font-medium">{STATES[slug].name}</div>
                    {META[slug]?.tag && (
                      <div className="text-xs text-muted-foreground">{META[slug].tag}</div>
                    )}
                  </div>
                  {active.includes(slug) && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-green-100 text-green-800">Active</span>
                  )}
                  {!active.includes(slug) && pipeline.includes(slug) && (
                    <span className="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-800">Pipeline</span>
                  )}
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  {q ? `No states match “${q}”.` : "No states available."}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center sm:flex-row gap-3 sm:justify-end">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm hover:bg-accent"
          >
            View Projects
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90"
          >
            Book an expert
          </Link>
        </div>
      </main>
    </>
  );
}
