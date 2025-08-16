import { useRouter } from "next/router";
import { useEffect } from "react";
import Link from "next/link";
import StatePageShell from "@/components/StatePageShell";
import StateProjectBody from "@/components/StateProjectBody";
import { getStateBySlug } from "@/data/states";

export default function NigeriaStatePage() {
  const router = useRouter();
  const { slug } = router.query;

  const state = typeof slug === "string" ? getStateBySlug(slug) : undefined;

  useEffect(() => {
    if (typeof slug === "string" && !state) {
      router.replace(`/projects/nigeria/states/${slug}/facts`);
    }
  }, [state, slug, router]);

  if (typeof slug !== "string" || !state) return null;

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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 space-y-6">
        <StatePageShell
          slug={slug}
          status={state.status}
          showFactsLink={Boolean(state.facts && state.facts.length)}
        >
          <StateProjectBody state={state} />
        </StatePageShell>
      </main>
    </>
  );
}

