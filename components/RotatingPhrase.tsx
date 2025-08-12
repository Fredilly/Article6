import React, { useEffect, useMemo, useRef, useState } from "react";

type RotatingPhraseProps = {
  phrases: string[];              // e.g., ["governments", "treasuries", "climate teams"]
  className?: string;             // tailwind for the visible text
  typeSpeedMs?: number;           // typing speed per char
  deleteSpeedMs?: number;         // delete speed per char
  holdMs?: number;                // hold time at full word
  preTypeDelayMs?: number;        // pause before typing next word
  postDeleteDelayMs?: number;     // pause after clearing word
  reducedMotionFallback?: string; // shown if prefers-reduced-motion: reduce
};

export default function RotatingPhrase({
  phrases,
  className = "",
  typeSpeedMs = 90,
  deleteSpeedMs = 60,
  holdMs = 2600,
  preTypeDelayMs = 400,
  postDeleteDelayMs = 650,
  reducedMotionFallback = ""
}: RotatingPhraseProps) {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phase, setPhase] = useState<"typing"|"holding"|"deleting">("typing");
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const list = useMemo(() => phrases.filter(Boolean), [phrases]);

  // Measure widest phrase (using same font classes)
  useEffect(() => {
    function measure() {
      if (!measureRef.current) return;
      let widest = 0;
      const children = Array.from(measureRef.current.children) as HTMLElement[];
      for (const el of children) widest = Math.max(widest, el.offsetWidth);
      setMaxWidth(widest);
    }
    // wait for fonts if supported
    // @ts-ignore
    const ready = (document.fonts?.ready as Promise<void>) ?? Promise.resolve();
    ready.then(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list]);

  // Typewriter loop (no layout shift because container width is fixed)
  useEffect(() => {
    if (prefersReduced) return; // handled by fallback render
    const current = list[phraseIdx % list.length] ?? "";
    let timeout: number | null = null;
    let nextTimeout: number | null = null;

    const step = () => {
      if (phase === "typing") {
        if (display.length < current.length) {
          setDisplay(current.slice(0, display.length + 1));
          timeout = window.setTimeout(() => rafRef.current = requestAnimationFrame(step), typeSpeedMs);
        } else {
          setPhase("holding");
          timeout = window.setTimeout(() => rafRef.current = requestAnimationFrame(step), holdMs);
        }
      } else if (phase === "holding") {
        setPhase("deleting");
        timeout = window.setTimeout(() => rafRef.current = requestAnimationFrame(step), deleteSpeedMs);
      } else if (phase === "deleting") {
        if (display.length > 0) {
          setDisplay(current.slice(0, display.length - 1));
          timeout = window.setTimeout(() => rafRef.current = requestAnimationFrame(step), deleteSpeedMs);
        } else {
          timeout = window.setTimeout(() => {
            setPhraseIdx((i) => (i + 1) % list.length);
            nextTimeout = window.setTimeout(() => {
              setPhase("typing");
              rafRef.current = requestAnimationFrame(step);
            }, preTypeDelayMs);
          }, postDeleteDelayMs);
        }
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeout) clearTimeout(timeout);
      if (nextTimeout) clearTimeout(nextTimeout);
    };
  }, [display, phase, phraseIdx, list, typeSpeedMs, deleteSpeedMs, holdMs, preTypeDelayMs, postDeleteDelayMs, prefersReduced]);

  // Fixed-width inline block prevents re-centering
  const fixedStyle = maxWidth ? { width: `${maxWidth}px` } : undefined;

  // If user prefers reduced motion, render static fallback
  if (prefersReduced && reducedMotionFallback) {
    return <span className={className}>{reducedMotionFallback}</span>;
  }

  return (
    <>
      {/* Offscreen measurement block */}
      <div ref={measureRef} className={`${className} absolute -z-10 invisible top-0 left-0 whitespace-nowrap`}>
        {list.map((p, i) => (
          <span key={i} className="inline-block px-0">{p}</span>
        ))}
      </div>

      {/* Visible fixed-width container; aria-hidden to avoid repeated announcements */}
      <span className={`inline-block whitespace-nowrap align-baseline ${className}`} style={fixedStyle} aria-hidden="true">
        {display}
      </span>

      {/* Screen-reader only stable label (won't spam SR with changes) */}
      <span className="sr-only">{list[0] ?? "governments"}</span>
    </>
  );
}
