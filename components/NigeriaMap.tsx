"use client";
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import nigeria from "@svg-maps/nigeria";
import { SLUGS, STATES } from "@/data/country";

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
  pipeline = [] as string[],
  links: _links = {} as Record<string, string>, // legacy no-op
  onHover,
}: {
  active?: string[];
  pipeline?: string[];
  links?: Record<string, string>;
  onHover?: (slug: string | null) => void;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const delayRef = useRef<number>();
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredSlug, setHoveredSlug] = useState<Slug | null>(null);
  const [visible, setVisible] = useState(false);

  const COUNTRY_BASE = "/projects/nigeria";
  const activeSet = useMemo(
    () => new Set(active.map((a) => norm(a) as Slug)),
    [active]
  );
  const pipelineSet = useMemo(
    () => new Set(pipeline.map((p) => norm(p) as Slug)),
    [pipeline]
  );
  const divisions = useMemo<Division[]>(
    () =>
      SLUGS.map((slug) => ({
        slug,
        inPipeline: activeSet.has(slug) || pipelineSet.has(slug),
      })),
    [activeSet, pipelineSet]
  );
  const divisionMap = useMemo(
    () => new Map<Slug, Division>(divisions.map((d) => [d.slug, d])),
    [divisions]
  );

  const data = nigeria as unknown as NigeriaData;
  const locations = useMemo(
    () =>
      data.locations.map((loc: any) => ({
        ...loc,
        properties: {
          ...loc.properties,
          slug: norm(loc.properties?.slug ?? loc.id) as Slug,
        },
      })),
    [data]
  );
  const [, , vbW, vbH] = data.viewBox.split(" ").map(Number);
  const scaleX = 1000 / vbW;
  const scaleY = 1000 / vbH;

  const OFFSET = 12;

  const updatePosition = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    const tipEl = tipRef.current;
    let x = clientX - r.left + OFFSET;
    let y = clientY - r.top + OFFSET;
    if (tipEl) {
      const { offsetWidth, offsetHeight } = tipEl;
      x = Math.min(x, r.width - offsetWidth - OFFSET);
      y = Math.min(y, r.height - offsetHeight - OFFSET);
    }
    setCoords({ x, y });
  };

    return (
      <div className="relative w-full">
        <svg
          ref={svgRef}
          viewBox="0 0 1000 1000"
          className="w-full h-auto"
          onClick={() => setVisible(false)}
          role="img"
          aria-label="Map of Nigeria by state"
        >
          <g transform={`scale(${scaleX} ${scaleY})`}>
            {locations.map((loc) => {
              const slug = loc.properties?.slug as Slug | undefined;
              const title = slug && STATES[slug] ? STATES[slug].name : null;
              const valid = Boolean(title);
              const isActive = slug ? activeSet.has(slug) : false;
              const isPipeline = slug ? !isActive && pipelineSet.has(slug) : false;
              const baseFill = isActive
                ? "#16A34A"
                : isPipeline
                ? "#FCD34D"
                : "#F3F4F6";
              const hoverFill = isActive
                ? "#22C55E"
                : isPipeline
                ? "#FBBF24"
                : "#E5E7EB";
              const entry = slug ? divisionMap.get(slug) : undefined;
              const href = entry
                ? entry.inPipeline
                  ? `${COUNTRY_BASE}/states/${slug}`
                  : `${COUNTRY_BASE}/states/${slug}/facts`
                : undefined;

              const handleEnter = valid
                ? (e: React.MouseEvent<SVGPathElement>) => {
                    const { clientX, clientY } = e;
                    const s = slug as Slug;
                    if (delayRef.current) window.clearTimeout(delayRef.current);
                    setHoveredSlug(s);
                    rafRef.current && cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(() => updatePosition(clientX, clientY));
                    delayRef.current = window.setTimeout(() => setVisible(true), 120);
                    onHover?.(s);
                  }
                : undefined;

              const handleMove = valid
                ? (e: React.MouseEvent<SVGPathElement>) => {
                    const { clientX, clientY } = e;
                    rafRef.current && cancelAnimationFrame(rafRef.current);
                    rafRef.current = requestAnimationFrame(() => updatePosition(clientX, clientY));
                  }
                : undefined;

              const handleLeave = valid
                ? () => {
                    if (delayRef.current) window.clearTimeout(delayRef.current);
                    setVisible(false);
                    setHoveredSlug(null);
                    onHover?.(null);
                  }
                : undefined;

              const handleClick = entry
                ? (e: React.MouseEvent<SVGPathElement>) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (href) router.push(href);
                  }
                : valid
                ? (e: React.MouseEvent<SVGPathElement>) => {
                    e.stopPropagation();
                    const { clientX, clientY } = e;
                    const s = slug as Slug;
                    if (hoveredSlug === s && visible) {
                      setVisible(false);
                      setHoveredSlug(null);
                    } else {
                      setHoveredSlug(s);
                      updatePosition(clientX, clientY);
                      setVisible(true);
                    }
                  }
                : undefined;

              const pathProps = {
                "data-slug": slug,
                d: loc.path,
                className: `transition-colors ${entry ? "cursor-pointer" : "pointer-events-none"}`,
                style: {
                  fill: baseFill,
                  stroke: "#D1D5DB",
                  strokeWidth: 1.5,
                  pointerEvents: entry ? undefined : "none",
                },
                onMouseEnter: handleEnter,
                onMouseMove: handleMove,
                onMouseLeave: handleLeave,
                onMouseOver: (e: React.MouseEvent<SVGPathElement>) => {
                  (e.currentTarget as SVGPathElement).style.fill = hoverFill;
                },
                onMouseOut: (e: React.MouseEvent<SVGPathElement>) => {
                  (e.currentTarget as SVGPathElement).style.fill = baseFill;
                },
                onClick: handleClick,
                "aria-label": title ?? undefined,
              } as React.SVGProps<SVGPathElement>;

              return (
                <a key={slug ?? loc.id} href={href ?? undefined}>
                  <path {...pathProps} />
                </a>
              );
            })}
          </g>
      </svg>
      {visible && hoveredSlug && (
        <div
          ref={tipRef}
          role="tooltip"
          aria-live="polite"
          className="pointer-events-none absolute z-50 rounded-md bg-white/80 px-2 py-1 text-xs shadow backdrop-blur-sm"
          style={{ left: coords.x, top: coords.y }}
        >
          {STATES[hoveredSlug].name}
        </div>
      )}
    </div>
  );
}

