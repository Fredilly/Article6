import React from 'react';
import Link from 'next/link';

export interface BreadcrumbSegment {
  href: string;
  label: string;
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ segments }) => {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        {segments.map((segment, index) => (
          <li key={segment.href} className="flex items-center">
            <Link href={segment.href} title={segment.label} className="hover:underline">
              {segment.label}
            </Link>
            {index < segments.length - 1 && <span className="mx-2">&gt;</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
