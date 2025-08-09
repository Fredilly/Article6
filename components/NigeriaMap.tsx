'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";

const SVG_SRC =
  "https://ik.imagekit.io/tzublgy5d/Article6/Nigeria_States_map.svg?updatedAt=1754750515782";

type Props = { active?: string[] };

const EPITHETS: Record<string, string> = {
  niger: "The Power State",
  kwara: "State of Harmony",
  plateau: "Home of Peace and Tourism",
  // add others later if you like
};

export default function NigeriaMap({ active = [] }: Props) {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  const activeSet = useMemo(() => new Set(active.map(s => s.toLowerCase())), [active]);

  // Fetch + mount the external SVG once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(SVG_SRC, { cache: "force-cache" });
      const txt = await res.text();
      if (cancelled) return;

      const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      const svg = doc.documentElement as unknown as SVGSVGElement;

      // make responsive
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.setAttribute("class", "w-full h-auto");
      svg.style.maxWidth = "900px";

      // pointer + tooltip + routing per <path> with an id
      const paths = Array.from(svg.querySelectorAll("path[id]")) as SVGPathElement[];
      paths.forEach((p) => {
        const slug = p.id.toLowerCase(); // ids in SVG should be state slugs
        const isActive = activeSet.has(slug);

        p.style.cursor = "pointer";
        p.style.transition = "fill 120ms ease";
        p.style.fill = isActive ? "#16A34A" : "#E5E7EB";
        p.style.stroke = "#D1D5DB";
        p.style.strokeWidth = "1.5";

        p.addEventListener("mouseenter", () => {
          const name = p.getAttribute("data-name") || p.id;
          const epithet = EPITHETS[slug] ? ` — ${EPITHETS[slug]}` : "";
          setTip({ x: 0, y: 0, text: `${name}${epithet}` });
          p.style.fill = "#22C55E";
        });
        p.addEventListener("mouseleave", () => {
          setTip(null);
          p.style.fill = isActive ? "#16A34A" : "#E5E7EB";
        });
        p.addEventListener("mousemove", (e: MouseEvent) => {
          const rect = (svg as SVGSVGElement).getBoundingClientRect();
          setTip((t) => (t ? { ...t, x: e.clientX - rect.left + 12, y: e.clientY - rect.top + 12 } : null));
        });
        p.addEventListener("click", () => {
          router.push(`/states/${slug}`);
        });
      });

      // Mount into DOM
      if (mountRef.current) {
        mountRef.current.innerHTML = "";
        mountRef.current.appendChild(svg);
        svgRef.current = svg;
      }
    })();
    return () => {
      cancelled = true;
      setTip(null);
      if (mountRef.current) mountRef.current.innerHTML = "";
      svgRef.current = null;
    };
  // mount once; color updates handled in next effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update fills when `active` changes
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = Array.from(svg.querySelectorAll("path[id]")) as SVGPathElement[];
    paths.forEach((p) => {
      const slug = p.id.toLowerCase();
      const isActive = activeSet.has(slug);
      // only reset if not hovered
      if (!p.matches(":hover")) {
        p.style.fill = isActive ? "#16A34A" : "#E5E7EB";
      }
    });
  }, [activeSet]);

  return (
    <div className="relative max-w-3xl mx-auto px-4">
      <div ref={mountRef} />
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

