"use client";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import nigeria from "@svg-maps/nigeria";
import { nigeria as ng } from "@/data/countries/nigeria";

type NigeriaData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

const ALIASES: Record<string, string> = {
  nassarawa: "nasarawa",
};

const BASE = "/projects/nigeria/states";

function norm(slug: string) {
  const s = slug.toLowerCase();
  return ALIASES[s] ?? s;
}

function onClickFeature(slug: string, router: ReturnType<typeof useRouter>) {
  const entry = ng.divisions.find((d) => d.slug === slug);
  if (!entry) return;
  const href = entry.inPipeline ? `${BASE}/${slug}` : `${BASE}/${slug}/facts`;
  router.push(href);
}

export default function NigeriaMap({
  active = [] as string[],
  links: _links = {} as Record<string, string>,
  onHover,
}: {
  active?: string[];
  links?: Record<string, string>;
  onHover?: (slug: string | null) => void;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const data = nigeria as unknown as NigeriaData;
  const [, , vbW, vbH] = data.viewBox.split(" ").map(Number);
  const scaleX = 1000 / vbW;
  const scaleY = 1000 / vbH;

  const activeSet = useMemo(() => new Set(active.map((a) => norm(a))), [active]);

  const onMove = (e: React.MouseEvent) => {
    if (!tip || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    setTip({ ...tip, x: e.clientX - r.left + 12, y: e.clientY - r.top + 12 });
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
          {data.locations.map((loc) => {
            const raw = loc.id.toLowerCase();
            const slug = ALIASES[raw] ?? raw;
            const name = loc.name;
            const isActive = activeSet.has(slug);
            const hasData = ng.divisions.some((d) => d.slug === slug);
            const pathProps = {
              "data-slug": slug,
              d: loc.path,
              className: `transition-colors ${hasData ? "cursor-pointer" : "pointer-events-none opacity-60"}`,
              style: {
                fill: isActive ? "#16A34A" : "#E5E7EB",
                stroke: "#D1D5DB",
                strokeWidth: 1.5,
              },
              onClick: () => hasData && onClickFeature(slug, router),
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

