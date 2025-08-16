import { useRouter } from "next/router";
import Link from "next/link";
import StatePageShell from "@/components/StatePageShell";
import StateFactsBody from "@/components/StateFactsBody";
import { getStateBySlug } from "@/data/states";

export default function NigeriaStateFactsPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (typeof slug !== "string") return null;

  const state = getStateBySlug(slug);

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
        <StatePageShell slug={slug} status={state?.status}>
          <StateFactsBody facts={state?.facts} />
        </StatePageShell>
      </main>
    </>
  );
}
