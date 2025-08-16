import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import StateLayout from "@/components/state/StateLayout";
import { nigeria, Division } from "@/data/countries/nigeria";

interface Props {
  division: Division;
}

export default function StateFactsPage({ division }: Props) {
  const hasFacts = division.facts && division.facts.length > 0;

  return (
    <StateLayout
      title={division.title}
      subtitle={hasFacts ? "Did you know?" : "Register your interest"}
      breadcrumbHref={`/states/${division.slug}`}
      secondaryCta={
        <Link
          href={`/states/${division.slug}`}
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          View Project
        </Link>
      }
    >
      {hasFacts ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {division.facts!.slice(0, 3).map((f, i) => (
            <li
              key={f.id ?? i}
              className="rounded-2xl border bg-white/5 backdrop-blur p-4 shadow-sm"
            >
              {f.text}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border bg-white/5 backdrop-blur p-6">
          <p className="text-muted-foreground">
            This state isn’t in our active pipeline yet. Talk to our team about opportunities.
          </p>
        </div>
      )}
    </StateLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: nigeria.divisions.map((d) => ({ params: { slug: d.slug } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  const division = nigeria.divisions.find((d) => d.slug === slug);
  if (!division) {
    return { notFound: true, revalidate: 300 };
  }
  return {
    props: { division },
    revalidate: 300,
  };
};

