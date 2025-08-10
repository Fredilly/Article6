import { useRouter } from "next/router";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";

const ORDER = ["niger", "kwara", "plateau"];

export default function StatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const startIndex = typeof slug === "string" ? ORDER.indexOf(slug) : 0;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 md:pt-8">
      <StateDetailsCarousel
        states={ORDER}
        startIndex={startIndex >= 0 ? startIndex : 0}
      />
    </main>
  );
}

