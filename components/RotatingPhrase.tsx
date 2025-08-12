import React, { useEffect, useMemo, useRef, useState } from "react";

type RotatingPhraseProps = {
  phrases: string[];              // e.g. ["governments","treasuries","climate teams"]
  className?: string;
  typeSpeedMs?: number;           // default 200 (calm ~5 chars/sec)
  deleteSpeedMs?: number;         // default 120 (delete ~8 chars/sec)
  holdMs?: number;                // default 3000 (≈3s on full word)
  preTypeDelayMs?: number;        // default 1500 (pause before next word)
  postDeleteDelayMs?: number;     // default 700  (pause after clearing)
  reducedMotionFallback?: string; // if user prefers reduced motion
};

export default function RotatingPhrase({
  phrases,
  className = "",
  typeSpeedMs = 200,
  deleteSpeedMs = 120,
  holdMs = 3000,
  preTypeDelayMs = 1500,
  postDeleteDelayMs = 700,
  reducedMotionFallback = ""
}: RotatingPhraseProps) {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [phase, setPhase] = useState<"typing"|"holding"|"deleting">("typing");
  const [maxWidth, setMaxWidth] = useState<number>(0);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const list = useMemo(() => phrases.filter(Boolean), [phrases]);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // Measure widest phrase with the same styles to lock width (prevents layout shift)
  useEffect(() => {
    const measure = () => {
      if (!measureRef.current) return;
      let widest = 0;
      const kids = Array.from(measureRef.current.children) as HTMLElement[];
      for (const el of kids) widest = Math.max(widest, el.offsetWidth);
      setMaxWidth(widest);
    };
    // @ts-ignore
    const ready = (document.fonts?.ready as Promise<void>) ?? Promise.resolve();
    ready.then(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list, className]);

  // Typewriter loop with readable cadence + pre/post pauses
  useEffect(() => {
    if (prefersReduced) return;
    let timeout: number | null = null;
    const current = list[phraseIdx % list.length] ?? "";

    const step = () => {
      if (phase === "typing") {
        if (display.length < current.length) {
          setDisplay(current.slice(0, display.length + 1));
          timeout = window.setTimeout(() => {
            rafRef.current = requestAnimationFrame(step);
          }, typeSpeedMs);
        } else {
          setPhase("holding");
          timeout = window.setTimeout(() => {
            rafRef.current = requestAnimationFrame(step);
          }, holdMs);
        }
      } else if (phase === "holding") {
        setPhase("deleting");
        timeout = window.setTimeout(() => {
          rafRef.current = requestAnimationFrame(step);
        }, deleteSpeedMs);
      } else {
        if (display.length > 0) {
          setDisplay(current.slice(0, display.length - 1));
          timeout = window.setTimeout(() => {
            rafRef.current = requestAnimationFrame(step);
          }, deleteSpeedMs);
        } else {
          // Finished deleting: short pause, then wait preTypeDelayMs before typing
          timeout = window.setTimeout(() => {
            setPhraseIdx((i) => (i + 1) % list.length);
            window.setTimeout(() => {
              setPhase("typing");
              rafRef.current = requestAnimationFrame(step);
            }, preTypeDelayMs); // << this is the gap before the new word
          }, postDeleteDelayMs);
        }
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeout) clearTimeout(timeout);
    };
  }, [display, phase, phraseIdx, list, typeSpeedMs, deleteSpeedMs, holdMs, preTypeDelayMs, postDeleteDelayMs, prefersReduced]);

  const fixedStyle = maxWidth ? { width: `${maxWidth}px` } : undefined;

  // Reduced-motion: show a stable, non-animated word
  if (prefersReduced && reducedMotionFallback) {
    return <span className={className}>{reducedMotionFallback}</span>;
  }

  return (
    <>
      {/* invisible offscreen measurement using same className */}
      <div ref={measureRef} className={`${className} absolute -z-10 invisible top-0 left-0 whitespace-nowrap`}>
        {list.map((p, i) => (
          <span key={i} className="inline-block">{p}</span>
        ))}
      </div>

      {/* visible fixed-width span prevents re-centering */}
      <span
        className={`inline-block whitespace-nowrap align-baseline ${className}`}
        style={fixedStyle}
        aria-hidden="true"
      >
        {display}
      </span>
      {/* Screen readers get a stable label to avoid spammy announcements */}
      <span className="sr-only">{list[0] ?? "governments"}</span>
    </>
  );
}

