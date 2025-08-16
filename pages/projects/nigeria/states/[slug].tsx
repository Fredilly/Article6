import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";

const ORDER = ["niger", "kwara", "plateau"];

export default function StatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const startIndex = typeof slug === "string" ? ORDER.indexOf(slug) : 0;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const canonical =
    typeof slug === "string"
      ? `${baseUrl}/projects/nigeria/states/${slug}`
      : `${baseUrl}/projects/nigeria/states`;

  return (
    <>
      <Head>
        <link rel="canonical" href={canonical} />
        <title>State Details | Article6</title>
      </Head>
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-6">
        <Link
          href="/projects"
          className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <span className="mr-2">←</span> Back to Projects
        </Link>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20">
        <StateDetailsCarousel
          states={ORDER}
          startIndex={startIndex >= 0 ? startIndex : 0}
        />
      </main>
    </>
  );
}

