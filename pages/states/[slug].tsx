import { useRouter } from "next/router";
import Link from "next/link";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";
import { ACTIVE } from "@/data/country";
import { nigeria } from "@/data/countries/nigeria";

const ORDER = ACTIVE;

export default function StatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const currentSlug = typeof slug === "string" ? slug : "";
  const startIndex = typeof slug === "string" ? ORDER.indexOf(slug) : 0;
  const div = nigeria.divisions.find((d) => d.slug === currentSlug);
  const hasFacts = (div?.facts?.length ?? 0) > 0;

  return (
    <>
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <span className="mr-2">←</span> Back to Projects
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition"
            >
              Book an Expert
            </Link>
            {hasFacts && (
              <Link
                href={`/states/${currentSlug}/facts`}
                className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-white/5 transition"
              >
                Facts
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
        <StateDetailsCarousel
          states={ORDER}
          startIndex={startIndex >= 0 ? startIndex : 0}
        />
      </main>
    </>
  );
}

