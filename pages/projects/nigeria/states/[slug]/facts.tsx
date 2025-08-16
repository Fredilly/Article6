import { useRouter } from "next/router";
import Link from "next/link";

export default function NigeriaStateFactsPage() {
  const { slug } = useRouter().query;
  const name = typeof slug === "string" ? slug : "";

  return (
    <>
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-6">
        <Link
          href="/projects"
          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span className="mr-2">←</span> Back to Projects
        </Link>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
        <div className="rounded-2xl border bg-white shadow-sm">
          <div className="p-6 border-b">
            <h1 className="text-3xl font-semibold tracking-tight capitalize">{name} Facts</h1>
            <p className="text-muted-foreground mt-1">Coming soon.</p>
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
                Book an expert
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

