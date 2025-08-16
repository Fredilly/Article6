import Link from "next/link";
import { ReactNode } from "react";

interface StateLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbHref?: string;
  primaryCtaHref?: string;
  primaryCtaLabel?: string;
  secondaryCta?: ReactNode;
  children: ReactNode;
}

export default function StateLayout({
  title,
  subtitle,
  breadcrumbHref,
  primaryCtaHref = "/contact",
  primaryCtaLabel = "Book an Expert",
  secondaryCta,
  children,
}: StateLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {breadcrumbHref && (
        <Link
          href={breadcrumbHref}
          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span className="mr-2">←</span> Back
        </Link>
      )}

      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={primaryCtaHref}
          className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {primaryCtaLabel}
        </Link>
        {secondaryCta}
      </div>

      <div>{children}</div>
    </div>
  );
}

