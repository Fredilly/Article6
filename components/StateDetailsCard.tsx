import Link from "next/link";
import GalleryCarousel from "@/components/GalleryCarousel";
import { getStateBySlug } from "@/data/states";
import { stateMeta } from "@/data/stateMeta";

const STATUS_STYLES: Record<string, string> = {
  "In Discussion": "bg-yellow-100 text-yellow-800",
  "Pending Agreement": "bg-blue-100 text-blue-800",
  "Early Engagement": "bg-slate-100 text-slate-800",
};

export default function StateDetailsCard({ slug }: { slug: string }) {
  const state = getStateBySlug(slug);
  const meta = stateMeta[slug];

  if (!state || !meta) return null;

  const statusClass = STATUS_STYLES[state.status] || "bg-gray-100 text-gray-800";
  const images = state.images ?? [];

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-muted-foreground mt-1">{meta.subtitle}</p>
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
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacts</p>
              <div className="mt-2 space-y-1 text-sm">
                <div>{meta.contact}</div>
                {meta.role && <div className="text-xs text-muted-foreground">{meta.role}</div>}
              </div>
            </div>
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
  );
}

