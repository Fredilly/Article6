import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  phrases: string[];
  className?: string;
  typeSpeedMs?: number;
  deleteSpeedMs?: number;
  holdMs?: number;
  preTypeDelayMs?: number;
  postDeleteDelayMs?: number;
  reducedMotionFallback?: string;
  responsiveWrap?: boolean; // NEW: block on mobile, inline on desktop
};

export default function RotatingPhrase({
  phrases,
  className = '',
  typeSpeedMs = 110,
  deleteSpeedMs = 70,
  holdMs = 3200,
  preTypeDelayMs = 1200,
  postDeleteDelayMs = 800,
  reducedMotionFallback = '',
  responsiveWrap = false,
}: Props) {
  const list = useMemo(() => (phrases && phrases.length > 0 ? phrases : ['governments']), [phrases]);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [started, setStarted] = useState(false);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [w, setW] = useState<number>();
  const measRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handle = () => setPrefersReduced(mq.matches);
    handle();
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  useEffect(() => {
    if (measRef.current) {
      setW(measRef.current.getBoundingClientRect().width);
    }
  }, [list]);

  useEffect(() => {
    if (prefersReduced) return;
    const t = setTimeout(() => setStarted(true), preTypeDelayMs);
    return () => clearTimeout(t);
  }, [preTypeDelayMs, prefersReduced]);

  useEffect(() => {
    if (!started || prefersReduced) return;
    let timeout: NodeJS.Timeout;
    const current = list[index % list.length];

    if (!isDeleting) {
      if (text.length < current.length) {
        timeout = setTimeout(() => setText(current.slice(0, text.length + 1)), typeSpeedMs);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), holdMs);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(current.slice(0, text.length - 1)), deleteSpeedMs);
      } else {
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setIndex((i) => (i + 1) % list.length);
        }, postDeleteDelayMs);
      }
    }

    return () => clearTimeout(timeout);
  }, [
    text,
    isDeleting,
    started,
    index,
    list,
    typeSpeedMs,
    deleteSpeedMs,
    holdMs,
    postDeleteDelayMs,
    prefersReduced,
  ]);

  const styleVar = w ? ({ ['--rotW' as any]: `${w}px` } as React.CSSProperties) : undefined;
  if (prefersReduced && reducedMotionFallback)
    return <span className={className}>{reducedMotionFallback}</span>;

  return (
    <>
      <div
        ref={measRef}
        className={`${className} absolute -z-10 invisible top-0 left-0 whitespace-nowrap`}
      >
        {list.map((p, k) => (
          <span key={k} className="inline-block">
            {p}
          </span>
        ))}
      </div>

      <span
        className={[
          // Mobile: allow wrapping + natural width. Desktop: inline, no-wrap, fixed width.
          responsiveWrap
            ? 'block sm:inline-block sm:whitespace-nowrap whitespace-normal'
            : 'inline-block whitespace-nowrap',
          'align-baseline',
          // Tailwind arbitrary property to apply width var only on sm+
          'sm:[width:var(--rotW)]',
          className,
        ].join(' ')}
        style={styleVar}
        aria-hidden="true"
      >
        {text}
      </span>

      <span className="sr-only">{list[0] ?? 'governments'}</span>
    </>
  );
}

