import { useRouter } from "next/router";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";
import Breadcrumbs from "@/components/Breadcrumbs";
import { STATES } from "@/data/country";

const ORDER = ["niger", "kwara", "plateau"];

export default function StatePage() {
  const router = useRouter();
  const { slug } = router.query;
  const startIndex = typeof slug === "string" ? ORDER.indexOf(slug) : 0;
  const name = typeof slug === "string" ? STATES[slug]?.name || slug : "";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Countries", href: "/country" },
          { label: "Nigeria", href: "/country" },
          { label: "Projects", href: "/projects" },
          { label: name },
        ]}
      />
      <StateDetailsCarousel
        states={ORDER}
        startIndex={startIndex >= 0 ? startIndex : 0}
      />
    </main>
  );
}

