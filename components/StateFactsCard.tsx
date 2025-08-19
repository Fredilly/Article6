import React, { useEffect, useRef } from "react";
import stateFacts from "@/data/stateFacts.json";
import { X } from "lucide-react";

interface Props {
  slug: string;
  onClose: () => void;
}

export default function StateFactsCard({ slug, onClose }: Props) {
  const info = (stateFacts as Record<string, any>)[slug];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const selectors =
      'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])';
    const focusables = Array.from(
      node.querySelectorAll<HTMLElement>(selectors)
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Tab" && focusables.length > 0) {
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!info) return null;
  const { facts = [], cta } = info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg"
      >
        <button
          aria-label="Close"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="space-y-4">
          {facts.length > 0 && (
            <ul className="list-disc pl-5 text-sm leading-relaxed space-y-2">
              {facts.map((fact: string) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}
          {cta && (
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <a
                href={cta.primaryHref}
                className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {cta.primaryLabel}
              </a>
              <a
                href={cta.secondaryHref}
                className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                {cta.secondaryLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
