import React, { useEffect, useMemo, useRef, useState } from "react";

type Phase = "typing" | "holding" | "deleting" | "gap";

type Props = {
  phrases: string[];
  className?: string;
  typeSpeedMs?: number;       // per char while typing
  deleteSpeedMs?: number;     // per char while deleting
  holdMs?: number;            // full word on screen
  preTypeDelayMs?: number;    // empty pause before next word begins typing
  postDeleteDelayMs?: number; // empty pause right after clearing
  reducedMotionFallback?: string;
};

export default function RotatingPhrase({
  phrases,
  className = "",
  // >>> Readable keynote pacing <<<
  typeSpeedMs = 240,          // ~4 chars/sec (calm)
  deleteSpeedMs = 150,        // a touch faster than typing
  holdMs = 3400,              // ~3.4s fully visible
  preTypeDelayMs = 1200,      // 1.2s gap before next word starts
  postDeleteDelayMs = 800,    // 0.8s gap after clearing
  reducedMotionFallback = "",
}: Props) {
  const list = useMemo(() => phrases.filter(Boolean), [phrases]);

  // StrictMode‑safe single timer
  const t = useRef<number | null>(null);
  const clear = () => { if (t.current) { clearTimeout(t.current); t.current = null; } };

  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

  // lock width to the widest phrase (prevents re-centering)
  const [maxW, setMaxW] = useState(0);
  const measRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const measure = () => {
      if (!measRef.current) return;
      let w = 0;
      for (const el of Array.from(measRef.current.children) as HTMLElement[]) w = Math.max(w, el.offsetWidth);
      setMaxW(w);
    };
    // @ts-ignore
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list, className]);

  const prefersReduced = typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (prefersReduced) return;
    const word = list[idx % list.length] ?? "";
    clear();
    const wait = (ms:number, fn:()=>void) => { t.current = window.setTimeout(fn, ms); };

    if (phase === "typing") {
      if (text.length < word.length) wait(typeSpeedMs, () => setText(word.slice(0, text.length + 1)));
      else wait(holdMs, () => setPhase("deleting"));
    } else if (phase === "deleting") {
      if (text.length > 0) wait(deleteSpeedMs, () => setText(word.slice(0, text.length - 1)));
      else wait(postDeleteDelayMs, () => setPhase("gap"));
    } else if (phase === "gap") {
      wait(preTypeDelayMs, () => { setIdx((i) => (i + 1) % list.length); setPhase("typing"); });
    }
    return clear;
  }, [list, idx, phase, text, typeSpeedMs, deleteSpeedMs, holdMs, preTypeDelayMs, postDeleteDelayMs, prefersReduced]);

  const fixed = maxW ? { width: `${maxW}px` } : undefined;
  if (prefersReduced && reducedMotionFallback) return <span className={className}>{reducedMotionFallback}</span>;

  return (
    <>
      {/* invisible measurement using same typography */}
      <div ref={measRef} className={`${className} absolute -z-10 invisible top-0 left-0 whitespace-nowrap`}>
        {list.map((p, k) => <span key={k} className="inline-block">{p}</span>)}
      </div>
      {/* fixed-width animated text */}
      <span className={`inline-block whitespace-nowrap align-baseline ${className}`} style={fixed} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{list[0] ?? "governments"}</span>
    </>
  );
}

