import { useRouter } from "next/router";
import Head from "next/head";

export default function StateFactsPage() {
  const { slug } = useRouter().query;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonical =
    typeof slug === "string"
      ? `${baseUrl}/projects/nigeria/states/${slug}/facts`
      : `${baseUrl}/projects/nigeria/states/facts`;

  return (
    <>
      <Head>
        <link rel="canonical" href={canonical} />
        <title>State Facts | Article6</title>
      </Head>
      <main className="max-w-6xl mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          {typeof slug === "string" ? slug.charAt(0).toUpperCase() + slug.slice(1) : "State"} Facts
        </h1>
        <p className="text-muted-foreground">More information coming soon.</p>
      </main>
    </>
  );
}
