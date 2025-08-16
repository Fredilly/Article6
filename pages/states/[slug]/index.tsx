import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import StateLayout from "@/components/state/StateLayout";
import StateDetailsCard from "@/components/StateDetailsCard";
import { nigeria, Division } from "@/data/countries/nigeria";
import { getStateBySlug } from "@/data/states";
import { stateMeta } from "@/data/stateMeta";

interface Props {
  division: Division;
}

export default function StatePage({ division }: Props) {
  const project = getStateBySlug(division.slug);
  const meta = stateMeta[division.slug];

  return (
    <StateLayout
      title={division.title}
      subtitle={meta?.subtitle}
      breadcrumbHref="/projects"
      secondaryCta={
        division.facts?.length ? (
          <Link
            href={`/states/${division.slug}/facts`}
            className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Facts
          </Link>
        ) : null
      }
    >
      {project && meta ? (
        <StateDetailsCard slug={division.slug} showHeader={false} showFooter={false} />
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

