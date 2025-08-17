import { useRouter } from "next/router";
import StateDetailsCarousel from "@/components/StateDetailsCarousel";
import Breadcrumb from "@/components/Breadcrumb";
import { toTitle } from "@/data/country";

const ORDER = ["niger", "kwara", "plateau"];

export default function NigeriaStatePage() {
  const { slug } = useRouter().query;
  const slugStr = typeof slug === "string" ? slug : "";
  const startIndex = slugStr ? ORDER.indexOf(slugStr) : 0;
  const name = slugStr ? toTitle(slugStr) : "";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 space-y-6">
      <Breadcrumb
        segments={[
          { href: "/", label: "Home" },
          { href: "/countries", label: "Countries" },
          { href: "/country", label: "Nigeria" },
          { href: "/projects", label: "Projects" },
          { href: `/projects/nigeria/states/${slugStr}`, label: name },
        ]}
      />
      <StateDetailsCarousel
        states={ORDER}
        startIndex={startIndex >= 0 ? startIndex : 0}
      />
    </main>
  );
}
