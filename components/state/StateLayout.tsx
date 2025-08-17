import Link from "next/link";
import { ReactNode } from "react";

interface StateLayoutProps {
  title: string;
  subtitle?: string;
  stagePill?: string;
  backHref?: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  rightNav?: ReactNode;
  tertiaryCtaHref?: string;
  tertiaryCtaLabel?: string;
  children: ReactNode;
}

export default function StateLayout({
  title,
  subtitle,
  stagePill,
  backHref = "/projects/nigeria",
  primaryCtaHref = "/contact",
  primaryCtaLabel = "Book an Expert",
  rightNav,
  tertiaryCtaHref,
  tertiaryCtaLabel = "Facts",
  children,
}: StateLayoutProps) {
  const allChildren = Array.isArray(children)
    ? children
    : [children];
  const sidebar = allChildren[allChildren.length - 1];
  const mainChildren = allChildren.slice(0, -1);
  const backLabel =
    backHref === "/country" ? "Back to Country" : "Back to Projects";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-6">
        <Link
          href={backHref}
          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span className="mr-2">←</span> {backLabel}
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stagePill && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800">
                {stagePill}
              </span>
            )}
            {rightNav}
          </div>
        </div>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">{mainChildren}</section>
        <aside className="lg:col-span-1">{sidebar}</aside>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end border-t pt-6">
        {tertiaryCtaHref && (
          <Link
            href={tertiaryCtaHref}
            className="text-sm underline sm:mr-auto"
          >
            {tertiaryCtaLabel}
          </Link>
        )}
        <Link
          href="/country"
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          See National Map
        </Link>
        <Link
          href={primaryCtaHref}
          className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {primaryCtaLabel}
        </Link>
      </div>
    </div>
  );
}

