"use client";
import React, { useMemo, useRef, useState } from "react";
import nigeria from "@svg-maps/nigeria";

type NigeriaData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

const ALIASES: Record<string, string> = {
  fct: "federal-capital-territory",
  "cross-river": "cross-river",
};

function norm(slug: string) {
  const s = slug.toLowerCase();
  return ALIASES[s] ?? s;
}

export default function NigeriaMap({
  active = [] as string[],
  links = {} as Record<string, string>,
  titles = {} as Record<string, string>,
}: {
  active?: string[];
  links?: Record<string, string>;
  titles?: Record<string, string>;
}) {
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
    <div className="relative max-w-3xl mx-auto px-4">
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
            const slug = loc.id.toLowerCase();
            const name = loc.name;
            const isActive = activeSet.has(slug);
            const link = links[slug];
            const titleText = titles[slug] ?? name;
            const pathProps = {
              "data-slug": slug,
              "data-name": name,
              d: loc.path,
              className: `transition-colors ${
                link ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2" : ""
              }`,
              style: {
                fill: isActive ? "#16A34A" : "#E5E7EB",
                stroke: "#D1D5DB",
                strokeWidth: 1.5,
              },
              onMouseEnter: () => {
                setTip({ x: 0, y: 0, text: titleText });
              },
              onMouseLeave: () => {
                setTip(null);
              },
              onMouseOver: (e: React.MouseEvent<SVGPathElement>) => {
                (e.currentTarget as SVGPathElement).style.fill = "#22C55E";
              },
              onMouseOut: (e: React.MouseEvent<SVGPathElement>) => {
                (e.currentTarget as SVGPathElement).style.fill = isActive ? "#16A34A" : "#E5E7EB";
              },
            } as React.SVGProps<SVGPathElement>;

            const pathEl = (
              <path {...pathProps}>
                <title>{titleText}</title>
              </path>
            );

            return link ? (
              <a
                key={loc.id}
                href={link}
                aria-label={`Open ${name} page`}
                className="focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {pathEl}
              </a>
            ) : (
              React.cloneElement(pathEl, { key: loc.id })
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

