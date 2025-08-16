import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import FactCard from "@/components/FactCard";
import { nigeria } from "@/data/countries/nigeria";

type Fact = { id?: string; text: string };
type Props = { slug: string; title: string; facts: Fact[] };

export default function FactsPage({ slug, title, facts }: Props) {
  const hasFacts = facts.length > 0;
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {hasFacts ? `Did you know about ${title}?` : `${title} — Register your interest`}
        </h1>
        {!hasFacts && (
          <p className="text-muted-foreground">
            This state isn’t in our active pipeline yet. Explore opportunities with our team.
          </p>
        )}
      </header>

      {hasFacts && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {facts.map((f, i) => (
            <FactCard key={f.id ?? i} text={f.text} />
          ))}
        </div>
      )}

      <div className="pt-2">
        <Link href="/contact" className="inline-flex items-center rounded-xl border px-4 py-2 shadow-sm hover:shadow transition">
          Book an Expert
        </Link>
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = nigeria.divisions.map((d) => d.slug);
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const div = nigeria.divisions.find((d) => d.slug === slug);
  if (!div) return { notFound: true };
  const facts = (div.facts ?? []).map((f, i) => ({ id: f.id ?? String(i), text: f.text }));
  return { props: { slug, title: div.title, facts }, revalidate: 300 };
};
