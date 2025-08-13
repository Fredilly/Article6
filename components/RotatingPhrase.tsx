import React, { useEffect, useMemo, useRef, useState } from "react";

type Phase = "typing" | "holding" | "deleting" | "gap";

type Props = {
  phrases: string[];
  className?: string;
  mobileBlock?: boolean; // NEW
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
  mobileBlock = false,
  // >>> Readable keynote pacing <<<
  typeSpeedMs = 240,          // ~4 chars/sec (calm)
  deleteSpeedMs = 150,        // a touch faster than typing
  holdMs = 3400,              // ~3.4s fully visible
  preTypeDelayMs = 1200,      // 1.2s gap before next word starts
  postDeleteDelayMs = 800,    // 0.8s gap after clearing
  reducedMotionFallback = "",
}: Props) {
  const list = useMemo(() => phrases.filter(Boolean), [phrases]);

  // compute longest phrase length for a rough min-width (prevents reflow)
  const longest = useMemo(() => list.reduce((a, b) => (b.length > a.length ? b : a), ""), [list]);
  const ch = Math.min(Math.max(longest.length, 10), 18); // clamp 10–18ch

  // StrictMode‑safe single timer
  const t = useRef<number | null>(null);
  const clear = () => { if (t.current) { clearTimeout(t.current); t.current = null; } };

  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");

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

  const baseClass = [
    "relative inline-block align-baseline",
    mobileBlock ? "block sm:inline" : "",
    className,
    "whitespace-nowrap",
  ].join(" ");

  if (prefersReduced && reducedMotionFallback) {
    return (
      <span className={baseClass} style={{ minWidth: `${ch}ch` }}>
        {reducedMotionFallback}
      </span>
    );
  }

  return (
    <span
      className={baseClass}
      style={{ minWidth: `${ch}ch` }}
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </span>
  );
}

