import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import GalleryCarousel from '@/components/GalleryCarousel';
import StateCard from '@/components/StateCard';
import { projects } from '@/data/projects';
import { getStateBySlug } from '@/data/states';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const STATUS_STYLES: Record<string, string> = {
  'In Discussion': 'bg-yellow-100 text-yellow-800',
  'Pending Agreement': 'bg-blue-100 text-blue-800',
  'Early Engagement': 'bg-slate-100 text-slate-800',
};

const StateDetailPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const state = typeof slug === 'string' ? getStateBySlug(slug) : undefined;

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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-8">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{state.title}</h1>
                <p className="text-muted-foreground mt-1">{state.epithet}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
                {state.status}
              </span>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 space-y-6">
              {images.length > 0 && <GalleryCarousel images={images} />}

              <div className="space-y-3">
                <h2 className="text-xl font-semibold">What we&apos;ve done so far</h2>
                <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                  {state.timeline.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              {state.nextSteps && state.nextSteps.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Next steps</h2>
                  <ol className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
                    {state.nextSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}

              {state.docs && state.docs.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-xl font-semibold">Documents shared</h2>
                  <div className="flex flex-wrap gap-2">
                    {state.docs.map((doc) => (
                      <a
                        key={doc.href}
                        href={doc.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 border rounded-full text-sm"
                      >
                        {doc.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <aside className="lg:col-span-1">
              <div className="rounded-xl border bg-muted/30 p-4 sticky top-20 space-y-4">
                {state.contacts && state.contacts.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacts</p>
                    <div className="mt-2 space-y-1 text-sm">
                      {state.contacts.map((c) => (
                        <div key={c.role}>
                          {c.role}: {c.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Focus Areas</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded-lg border text-xs">Rice (AWD)</span>
                    <span className="px-2 py-1 rounded-lg border text-xs">Forestry MRV</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>

          <div className="px-6 pb-6 pt-3 border-t bg-gradient-to-b from-transparent to-muted/30">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
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
          </div>
        </div>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Other States</h2>
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {projects.map((p) => (
                <CarouselItem
                  key={p.slug}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <StateCard {...p} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </section>
      </main>
    </>
  );
};

export default StateDetailPage;

