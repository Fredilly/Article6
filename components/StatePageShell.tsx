import Link from "next/link";
import { stateMeta } from "@/data/stateMeta";

const STATUS_STYLES: Record<string, string> = {
  "In Discussion": "bg-yellow-100 text-yellow-800",
  "Pending Agreement": "bg-blue-100 text-blue-800",
  "Early Engagement": "bg-slate-100 text-slate-800",
};

interface Props {
  slug: string;
  status?: string;
  showFactsLink?: boolean;
  children: React.ReactNode;
}

export default function StatePageShell({ slug, status, showFactsLink, children }: Props) {
  const meta = stateMeta[slug];
  if (!meta) return null;

  const statusClass = status ? STATUS_STYLES[status] || "bg-gray-100 text-gray-800" : "";

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="p-6 border-b">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{meta.title}</h1>
            <p className="text-muted-foreground mt-1">{meta.subtitle}</p>
          </div>
          {status && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}>
              {status}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">{children}</section>
        <aside className="lg:col-span-1">
          <div className="rounded-xl border bg-muted/30 p-4 sticky top-20 space-y-4">
            {meta.contact && (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Contacts</p>
                <div className="mt-2 space-y-1 text-sm">
                  <div>{meta.contact}</div>
                  {meta.role && <div className="text-xs text-muted-foreground">{meta.role}</div>}
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
          {showFactsLink && (
            <Link
              href={`/projects/nigeria/states/${slug}/facts`}
              className="sm:mr-auto text-sm text-muted-foreground hover:underline"
            >
              Facts
            </Link>
          )}
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
            Book an Expert
          </Link>
        </div>
      </div>
    </div>
  );
}
