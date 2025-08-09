import React from 'react';
import Link from 'next/link';

export const STATUS_COLORS: Record<string, string> = {
  'In Discussion': 'bg-amber-500',
  'Pending Agreement': 'bg-blue-500',
  'Early Engagement': 'bg-slate-500',
};

interface StateCardProps {
  slug: string;
  title: string;
  status: string;
  epithet?: string;
  summary: string;
}

const StateCard: React.FC<StateCardProps> = ({ slug, title, status, epithet, summary }) => {
  const statusColor = STATUS_COLORS[status] || 'bg-slate-400';

  return (
    <Link
      href={`/states/${slug}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded-2xl"
    >
      <article className="rounded-2xl border border-gray-200 shadow-sm p-6 transition-transform duration-150 hover:translate-y-[1px] hover:shadow-md bg-white">
        <header className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusColor}`} aria-hidden />
          <h3 className="text-base font-semibold">{title}</h3>
        </header>
        {epithet && <p className="text-sm text-gray-500 mt-1">{epithet}</p>}
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{summary}</p>
      </article>
    </Link>
  );
};

export default StateCard;
