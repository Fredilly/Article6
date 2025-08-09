'use client';
import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

type StateDef = { slug: string; name: string; epithet: string; d: string };

const STATES: StateDef[] = [
  // TODO: swap these rects for real geo paths later
  { slug: "niger",   name: "Niger",   epithet: "The Power State",            d: "M100 100 H420 V420 H100 Z" },
  { slug: "kwara",   name: "Kwara",   epithet: "State of Harmony",           d: "M460 200 H740 V420 H460 Z" },
  { slug: "plateau", name: "Plateau", epithet: "Home of Peace and Tourism",  d: "M300 460 H640 V740 H300 Z" },
];

export default function NigeriaMap({ active = [] as string[] }: { active: string[] }) {
  const router = useRouter();
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const activeSet = useMemo(() => new Set(active.map(s => s.toLowerCase())), [active]);

  const onMove = (e: React.MouseEvent) => {
    if (!tip || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    setTip({ ...tip, x: e.clientX - r.left + 12, y: e.clientY - r.top + 12 });
  };

  return (
    <div className="relative max-w-3xl mx-auto px-4">
      <svg ref={svgRef} viewBox="0 0 1000 1000" className="w-full h-auto" onMouseMove={onMove}>
        {STATES.map(s => {
          const isActive = activeSet.has(s.slug);
          return (
            <path
              key={s.slug}
              d={s.d}
              className="cursor-pointer transition-all"
              style={{ fill: isActive ? "#16A34A" : "#E5E7EB", stroke: "#D1D5DB", strokeWidth: 2 }}
              onMouseEnter={() => setTip({ x: 0, y: 0, text: `${s.name} — ${s.epithet}` })}
              onMouseLeave={() => setTip(null)}
              onMouseOver={(e) => { (e.currentTarget as SVGPathElement).style.fill = "#22C55E"; }}
              onMouseOut={(e) => { (e.currentTarget as SVGPathElement).style.fill = isActive ? "#16A34A" : "#E5E7EB"; }}
              onClick={() => router.push(`/states/${s.slug}`)}
            />
          );
        })}
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
