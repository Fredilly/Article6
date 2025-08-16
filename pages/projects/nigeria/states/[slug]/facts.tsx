import { useRouter } from "next/router";
import Link from "next/link";

export default function NigeriaStateFactsPage() {
  const { slug } = useRouter().query;
  const name = typeof slug === "string" ? slug : "";
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-4">
      <header>
        <Link
          href="/projects"
          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span className="mr-2">←</span> Back to Projects
        </Link>
      </header>
      <h1 className="text-2xl font-semibold capitalize">{name} Facts</h1>
      <p className="text-muted-foreground">Coming soon.</p>
    </main>
  );
}

