import Link from "next/link";
import React from "react";

export type Technology = {
  slug: string;
  title: string;
  description: string;
  href?: string;
  icon?: React.ReactNode;
  tag?: string;
};

export default function TechnologyCard(props: Technology) {
  const content = (
    <article className="h-full rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5 sm:p-6">
        <header className="flex items-center gap-2">
          {props.icon && <span className="h-6 w-6 text-gray-700">{props.icon}</span>}
          <h3 className="text-base sm:text-lg font-semibold tracking-tight group-hover:text-gray-900">
            {props.title}
          </h3>
        </header>
        <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-gray-700 line-clamp-3">
          {props.description}
        </p>
        {props.tag && (
          <div className="mt-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-700 bg-gray-50">
              {props.tag}
            </span>
          </div>
        )}
      </div>
    </article>
  );

  if (props.href) {
    return (
      <Link
        href={props.href}
        className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
      >
        {content}
      </Link>
    );
  }
  return content;
}


