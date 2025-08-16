import { useRouter } from "next/router";
import Link from "next/link";
import CTA from "@/components/CTA";
import { getStateFacts } from "@/data/stateFacts";

export default function NigeriaStateFactsPage() {
  const { slug } = useRouter().query;
  const name = typeof slug === "string" ? slug : "";
  const facts = getStateFacts(name);

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
          </div>
          <div className="p-6 space-y-6">
            {facts.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                {facts.map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No facts available.</p>
            )}
            <CTA />
          </div>
        </div>
      </main>
    </>
  );
}

