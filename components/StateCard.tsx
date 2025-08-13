import Link from "next/link";
import React from "react";

interface StateCardProps {
  slug: string;
  title: string;
  epithet?: string;
  summary?: string;
  status?: "pending" | "active" | "discussion" | string;
  tags?: string[];
  updatedAt?: string;
  ctaLabel?: string;
}

const StateCard: React.FC<StateCardProps> = ({
  slug,
  title,
  epithet,
  summary,
  status,
  tags,
  updatedAt,
  ctaLabel,
}) => {
  const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
  return (
    <Link
      href={`/states/${slug}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      <article
        data-state-slug={slug}
        className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
        <div className="p-5 sm:p-6">
          <header className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                status === "pending"
                  ? "bg-amber-500"
                  : status === "active"
                  ? "bg-blue-500"
                  : status === "discussion"
                  ? "bg-emerald-500"
                  : "bg-slate-400"
              }`}
              aria-hidden
            />
            <h3 className="text-base sm:text-lg font-semibold tracking-tight group-hover:text-gray-900">
              {title}
            </h3>
          </header>

          {epithet && <p className="mt-1 text-sm text-gray-500">{epithet}</p>}

          {summary && (
            <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-gray-700 line-clamp-3">
              {summary}
            </p>
          )}

          {safeTags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {safeTags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-700 bg-gray-50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {(updatedAt || ctaLabel) && (
          <div className="hidden sm:flex items-center justify-between px-5 sm:px-6 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              {updatedAt ? `Updated ${updatedAt}` : "\u00A0"}
            </span>
            {ctaLabel && (
              <span className="text-xs font-medium text-emerald-700 group-hover:underline">
                {ctaLabel} →
              </span>
            )}
          </div>
        )}
      </article>
    </Link>
  );
};

export default StateCard;

