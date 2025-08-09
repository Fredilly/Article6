'use client';
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import nigeria from '@svg-maps/nigeria';

type NigeriaData = {
  viewBox: string;
  locations: { id: string; name: string; path: string }[];
};

const EPITHETS: Record<string, string> = {
  niger: 'The Power State',
  kwara: 'State of Harmony',
  plateau: 'Home of Peace and Tourism',
};

const ALIASES: Record<string, string> = {
  fct: 'federal-capital-territory',
  'cross-river': 'cross-river',
};

function norm(slug: string) {
  const s = slug.toLowerCase();
  return ALIASES[s] ?? s;
}

export default function NigeriaMap({ active = [] as string[] }) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const data = nigeria as unknown as NigeriaData;
  const [, , vbW, vbH] = data.viewBox.split(' ').map(Number);
  const scaleX = 1000 / vbW;
  const scaleY = 1000 / vbH;

  const activeSet = useMemo(() => new Set(active.map(a => norm(a))), [active]);

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
        aria-label="Map of Nigeria showing states"
      >
        <g transform={`scale(${scaleX} ${scaleY})`}>
          {data.locations.map((loc) => {
            const slug = loc.id.toLowerCase();
            const isActive = activeSet.has(slug);
            const epithet = EPITHETS[slug] ? ` — ${EPITHETS[slug]}` : '';
            return (
              <path
                key={loc.id}
                id={loc.id}
                d={loc.path}
                className="cursor-pointer transition-colors"
                style={{
                  fill: isActive ? '#16A34A' : '#E5E7EB',
                  stroke: '#D1D5DB',
                  strokeWidth: 1.5,
                }}
                onMouseEnter={() => {
                  setTip({ x: 0, y: 0, text: `${loc.name}${epithet}` });
                }}
                onMouseLeave={() => {
                  setTip(null);
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as SVGPathElement).style.fill = '#22C55E';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as SVGPathElement).style.fill = isActive ? '#16A34A' : '#E5E7EB';
                }}
                onClick={() => router.push(`/states/${slug}`)}
              >
                <title>{`${loc.name}${epithet}`}</title>
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

