import React from 'react';
import Link from 'next/link';

interface PreviewHeroProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  trustLine?: string;
  primaryCta?: { label: string; href: string };
  onPrimaryCtaClick?: () => void;
  secondaryCta?: { label: string; href: string };
  children?: React.ReactNode;
}

const PreviewHero: React.FC<PreviewHeroProps> = ({
  eyebrow,
  headline,
  body,
  trustLine,
  primaryCta,
  onPrimaryCtaClick,
  secondaryCta,
  children,
}) => {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16 items-center">
          <div className="lg:col-span-3">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-forest-600 mb-3">
                {eyebrow}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              {headline}
            </h1>
            {body && (
              <p className="mt-4 max-w-xl text-sm md:text-base text-gray-600 leading-relaxed">
                {body}
              </p>
            )}
            {(primaryCta || secondaryCta) && (
              <div className="mt-6 flex flex-wrap gap-3">
                {primaryCta && (
                  <Link
                    href={primaryCta.href}
                    onClick={onPrimaryCtaClick}
                    className="inline-flex items-center justify-center rounded-md bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
                  >
                    {primaryCta.label}
                  </Link>
                )}
                {secondaryCta && (
                  <Link
                    href={secondaryCta.href}
                    className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
                  >
                    {secondaryCta.label}
                  </Link>
                )}
              </div>
            )}
            {trustLine && (
              <p className="mt-5 text-xs text-gray-400 leading-relaxed max-w-md">
                {trustLine}
              </p>
            )}
          </div>
          {children && (
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PreviewHero;
