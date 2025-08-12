import React, { useEffect, useMemo, useRef, useState } from "react";
type Phase = "typing" | "holding" | "deleting" | "gap";
type Props = {
  phrases: string[];
  className?: string;
  typeSpeedMs?: number;       // per char (typing)
  deleteSpeedMs?: number;     // per char (deleting)
  holdMs?: number;            // full word visible
  preTypeDelayMs?: number;    // empty pause before next word starts typing
  postDeleteDelayMs?: number; // empty pause right after clearing
  reducedMotionFallback?: string;
};
export default function RotatingPhrase({
  phrases,
  className = "",
  // >>> Snappier pacing <<<
  typeSpeedMs = 250,          // ~7–8 chars/sec
  deleteSpeedMs = 90,         // clearly faster than typing
  holdMs = 3200,              // ≈3.2s on-screen
  preTypeDelayMs = 1200,      // 1.2s gap before next word
  postDeleteDelayMs = 800,    // 0.8s gap after clearing
  reducedMotionFallback = "",
}: Props) {
  const list = useMemo(() => phrases.filter(Boolean), [phrases]);
  const [text, setText] = useState(""); const [i, setI] = useState(0); const [phase, setPhase] = useState<Phase>("typing");
  const timer = useRef<number | null>(null); const cancel = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };

  // fixed width measurement (no layout shift)
  const [w, setW] = useState(0); const measRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const measure = () => {
      if (!measRef.current) return; let m = 0;
      for (const el of Array.from(measRef.current.children) as HTMLElement[]) m = Math.max(m, el.offsetWidth);
      setW(m);
    };
    // @ts-ignore
    (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(measure));
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list, className]);

  const prefersReduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  useEffect(() => {
    if (prefersReduced) return;
    const word = list[i % list.length] ?? "";
    cancel();
    const wait = (ms:number, fn:()=>void) => { timer.current = window.setTimeout(fn, ms); };

    if (phase === "typing") {
      if (text.length < word.length) wait(typeSpeedMs, () => setText(word.slice(0, text.length + 1)));
      else wait(holdMs, () => setPhase("deleting"));
    } else if (phase === "deleting") {
      if (text.length > 0) wait(deleteSpeedMs, () => setText(word.slice(0, text.length - 1)));
      else wait(postDeleteDelayMs, () => setPhase("gap"));
    } else if (phase === "gap") {
      wait(preTypeDelayMs, () => { setI((v) => (v + 1) % list.length); setPhase("typing"); });
    }
    return cancel;
  }, [list, i, phase, text, typeSpeedMs, deleteSpeedMs, holdMs, preTypeDelayMs, postDeleteDelayMs, prefersReduced]);

  const style = w ? { width: `${w}px` } : undefined;
  if (prefersReduced && reducedMotionFallback) return <span className={className}>{reducedMotionFallback}</span>;

  return (
    <>
      <div ref={measRef} className={`${className} absolute -z-10 invisible top-0 left-0 whitespace-nowrap`}>
        {list.map((p, k) => <span key={k} className="inline-block">{p}</span>)}
      </div>
      <span className={`inline-block whitespace-nowrap align-baseline ${className}`} style={style} aria-hidden="true">
        {text}
      </span>
      <span className="sr-only">{list[0] ?? "governments"}</span>
    </>
  );
}
