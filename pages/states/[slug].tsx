import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DetailsCarousel from '@/components/DetailsCarousel';
import GalleryCarousel from '@/components/GalleryCarousel';
import { getStateBySlug } from '@/data/states';
import { stateMeta } from '@/data/stateMeta';

const STATUS_STYLES: Record<string, string> = {
  'In Discussion': 'bg-yellow-100 text-yellow-800',
  'Pending Agreement': 'bg-blue-100 text-blue-800',
  'Early Engagement': 'bg-slate-100 text-slate-800',
};

const ORDER = ['niger', 'kwara', 'plateau'];

const StateDetailPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const slugStr = typeof slug === 'string' ? slug : '';
  const state = slugStr ? getStateBySlug(slugStr) : undefined;

  if (!state) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-2">State Not Found</h1>
        <p className="text-gray-600">Details for this state are not available.</p>
      </div>
    );
  }

  const statusClass = STATUS_STYLES[state.status] || 'bg-gray-100 text-gray-800';
  const images = state.images ?? [];
  const meta = stateMeta[slugStr] || { contact: "" };

  const overview = (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Overview</h2>
      <p className="text-sm leading-relaxed">{state.epithet}</p>
      {images.length > 0 && <GalleryCarousel images={images} />}
    </section>
  );

  const progress = (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">What we&apos;ve done so far</h2>
      <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
        {state.timeline.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );

  const nextSteps = (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">Next steps</h2>
      <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
        {state.nextSteps?.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );

  const contacts = (
    <aside className="space-y-4">
      <h2 className="text-xl font-semibold">Contacts</h2>
      <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
        <div>
          <span className="font-medium">Contact:</span> {meta.contact}
        </div>
        {meta.role && <div className="text-muted-foreground">{meta.role}</div>}
      </div>
    </aside>
  );

  const idx = ORDER.indexOf(slugStr);
  const prev = ORDER[(idx - 1 + ORDER.length) % ORDER.length];
  const next = ORDER[(idx + 1) % ORDER.length];
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

  return (
    <>
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-6">
        <div className="flex items-center md:justify-between justify-start gap-3">
          <Link
            href="/projects"
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <span className="mr-2">←</span> Back to Projects
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{state.title}</h1>
            <p className="text-muted-foreground mt-1">{state.epithet}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
            {state.status}
          </span>
        </div>

        <DetailsCarousel overview={overview} progress={progress} nextSteps={nextSteps} contacts={contacts} />

        <div className="px-6 pb-6 pt-3 border-t bg-gradient-to-b from-transparent to-muted/30 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
          <Link
            href="/country"
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            See National Map
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Request Brief
          </Link>
        </div>

        <div className="px-6 pb-6 pt-3 border-t bg-gradient-to-b from-transparent to-muted/30">
          <div className="flex items-center justify-between">
            <Link
              href={`/states/${prev}`}
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-accent"
            >
              ← {cap(prev)}
            </Link>
            <Link
              href={`/states/${next}`}
              className="inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm hover:opacity-90"
            >
              {cap(next)} →
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default StateDetailPage;

