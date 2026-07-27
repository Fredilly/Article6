import React from 'react';
import Link from 'next/link';

interface PreviewHeroProps {
  eyebrow?: string;
  headline: string;
  body?: string;
  supportingText?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  className?: string;
}

const PreviewHero: React.FC<PreviewHeroProps> = ({
  eyebrow,
  headline,
  body,
  supportingText,
  primaryCta,
  secondaryCta,
  className = '',
}) => {
  return (
    <section
      className={`relative overflow-hidden bg-gradient-to-br from-forest-50 via-white to-forest-50 ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(26,107,48,0.06),transparent_50%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-16 md:py-24 lg:py-28">
        {eyebrow && (
          <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.15em] text-forest-600 mb-4">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-forest-900 leading-tight max-w-3xl">
          {headline}
        </h1>
        {body && (
          <p className="mt-5 max-w-2xl text-base md:text-lg text-gray-600 leading-relaxed">
            {body}
          </p>
        )}
        {supportingText && (
          <p className="mt-3 text-sm md:text-base text-gray-500">{supportingText}</p>
        )}
        {(primaryCta || secondaryCta) && (
          <div className="mt-8 flex flex-wrap gap-4">
            {primaryCta && (
              <Link
                href={primaryCta.href}
                className="inline-flex items-center justify-center rounded-md bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
              >
                {primaryCta.label}
              </Link>
            )}
            {secondaryCta && (
              <Link
                href={secondaryCta.href}
                className="inline-flex items-center justify-center rounded-md border border-forest-600 bg-white px-6 py-3 text-sm font-semibold text-forest-700 shadow-sm transition hover:bg-forest-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-600"
              >
                {secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PreviewHero;
