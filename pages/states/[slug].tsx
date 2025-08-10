import { useRouter } from "next/router";
import Link from "next/link";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";

const ORDER = ["niger", "kwara", "plateau"];

export default function StatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const startIndex = typeof slug === "string" ? ORDER.indexOf(slug) : 0;

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
        <StateDetailsCarousel
          states={ORDER}
          startIndex={startIndex >= 0 ? startIndex : 0}
        />
      </main>
    </>
  );
}

