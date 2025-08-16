"use client";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import nigeria from "@svg-maps/nigeria";
import { ACTIVE, PIPELINE, SLUGS } from "@/data/country";

type NigeriaData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

type Slug = (typeof SLUGS)[number];
type Division = { slug: Slug; inPipeline: boolean };

const ALIASES: Record<string, string> = {
  nassarawa: "nasarawa",
};

function norm(slug: string) {
  const s = slug.toLowerCase();
  return ALIASES[s] ?? s;
}

export default function NigeriaMap({
  active = [] as string[],
  links: _links = {} as Record<string, string>, // legacy no-op
  onHover,
}: {
  active?: string[];
  links?: Record<string, string>;
  onHover?: (slug: string | null) => void;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const COUNTRY_BASE = "/projects/nigeria";
  const divisions = useMemo<Division[]>(
    () =>
      SLUGS.map((slug) => ({
        slug,
        inPipeline: ACTIVE.includes(slug) || PIPELINE.includes(slug),
      })),
    []
  );
  const divisionMap = useMemo(
    () => new Map<Slug, Division>(divisions.map((d) => [d.slug, d])),
    [divisions]
  );

  const data = nigeria as unknown as NigeriaData;
  const locations = useMemo(
    () =>
      data.locations.map((loc) => ({
        ...loc,
        properties: { slug: norm(loc.id) as Slug },
      })),
    [data]
  );
  const [, , vbW, vbH] = data.viewBox.split(" ").map(Number);
  const scaleX = 1000 / vbW;
  const scaleY = 1000 / vbH;

  const activeSet = useMemo(() => new Set(active.map((a) => norm(a) as Slug)), [active]);

  const onMove = (e: React.MouseEvent) => {
    if (!tip || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    setTip({ ...tip, x: e.clientX - r.left + 12, y: e.clientY - r.top + 12 });
  };

  const onClickFeature = (feature: { properties?: { slug?: Slug } }) => {
    const slug = feature?.properties?.slug;
    if (!slug) return console.warn("Missing slug for clicked feature", feature);
    const entry = divisionMap.get(slug);
    if (!entry) return console.warn("No data for slug:", slug);
    const href = entry.inPipeline
      ? `${COUNTRY_BASE}/states/${slug}`
      : `${COUNTRY_BASE}/states/${slug}/facts`;
    router.push(href);
  };

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 1000 1000"
        className="w-full h-auto"
        onMouseMove={onMove}
        role="img"
        aria-label="Map of Nigeria by state"
      >
        <g transform={`scale(${scaleX} ${scaleY})`}>
          {locations.map((loc) => {
            const slug = loc.properties.slug;
            const name = loc.name;
            const isActive = activeSet.has(slug);
            const entry = divisionMap.get(slug);
            const pathProps = {
              "data-slug": slug,
              d: loc.path,
              className: `transition-colors ${entry ? "cursor-pointer" : "pointer-events-none"}`,
              style: {
                fill: isActive ? "#16A34A" : "#E5E7EB",
                stroke: "#D1D5DB",
                strokeWidth: 1.5,
                pointerEvents: entry ? undefined : "none",
              },
              onMouseEnter: () => {
                setTip({ x: 0, y: 0, text: name });
                onHover?.(slug);
              },
              onMouseLeave: () => {
                setTip(null);
                onHover?.(null);
              },
              onMouseOver: (e: React.MouseEvent<SVGPathElement>) => {
                (e.currentTarget as SVGPathElement).style.fill = "#22C55E";
              },
              onMouseOut: (e: React.MouseEvent<SVGPathElement>) => {
                (e.currentTarget as SVGPathElement).style.fill = isActive ? "#16A34A" : "#E5E7EB";
              },
              onFocus: (e: React.FocusEvent<SVGPathElement>) => {
                onHover?.(slug);
                (e.currentTarget as SVGPathElement).style.fill = "#22C55E";
              },
              onBlur: (e: React.FocusEvent<SVGPathElement>) => {
                onHover?.(null);
                (e.currentTarget as SVGPathElement).style.fill = isActive ? "#16A34A" : "#E5E7EB";
              },
              onClick: entry ? () => onClickFeature(loc) : undefined,
            } as React.SVGProps<SVGPathElement>;

            return (
              <path key={slug} {...pathProps}>
                <title>{name}</title>
              </path>
            );
          })}
        </g>
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute rounded-md border border-gray-200 bg-white px-2 py-1 text-xs shadow"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
    </div>
  );
}

