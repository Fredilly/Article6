import Link from "next/link";
import React from "react";

export type Technology = {
  slug: string; // used for key / deep link
  title: string; // main heading
  description: string; // subtext
  href?: string; // optional external/internal link
  icon?: React.ReactNode; // optional icon (top-left)
  tag?: string; // optional badge
};

export default function TechnologyCard(t: Technology) {
  const content = (
    <article className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 sm:p-6">
        <header className="flex items-center gap-2">
          {t.icon && <span className="text-gray-700">{t.icon}</span>}
          <h3 className="text-base sm:text-lg font-semibold tracking-tight group-hover:text-gray-900">
            {t.title}
          </h3>
        </header>

        {t.description && (
          <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-gray-700 line-clamp-3">
            {t.description}
          </p>
        )}

        {t.tag && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-700 bg-gray-50">
              {t.tag}
            </span>
          </div>
        )}
      </div>
    </article>
  );

  return t.href ? (
    <Link
      href={t.href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      {content}
    </Link>
  ) : (
    <div className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl">
      {content}
    </div>
  );
}


