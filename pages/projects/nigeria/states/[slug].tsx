import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { nigeria } from "@/data/countries/nigeria";

type Props = {
  slug: string;
  title: string;
  hasFacts: boolean;
};

export default function StateDetail({ slug, title, hasFacts }: Props) {
  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">Project details for {title}.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link href="/contact" className="inline-flex items-center rounded-xl border px-4 py-2 shadow-sm hover:shadow transition">
          Book an Expert
        </Link>
        {hasFacts && (
          <Link
            href={`/projects/nigeria/states/${slug}/facts`}
            className="inline-flex items-center rounded-xl border px-4 py-2 hover:bg-white/5 transition"
          >
            Facts
          </Link>
        )}
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
  const hasFacts = Array.isArray(div.facts) && div.facts.length > 0;
  return { props: { slug, title: div.title, hasFacts }, revalidate: 300 };
};
