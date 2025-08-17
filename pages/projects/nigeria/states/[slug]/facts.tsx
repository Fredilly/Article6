import { useRouter } from "next/router";
import CTA from "@/components/CTA";
import Breadcrumb from "@/components/Breadcrumb";
import { getStateFacts } from "@/data/stateFacts";
import { toTitle } from "@/data/country";

export default function NigeriaStateFactsPage() {
  const { slug } = useRouter().query;
  const slugStr = typeof slug === "string" ? slug : "";
  const name = slugStr ? toTitle(slugStr) : "";
  const facts = getStateFacts(slugStr);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 md:pt-20 space-y-6">
      <Breadcrumb
        segments={[
          { href: "/", label: "Home" },
          { href: "/countries", label: "Countries" },
          { href: "/country", label: "Nigeria" },
          { href: "/projects", label: "Projects" },
          { href: `/projects/nigeria/states/${slugStr}/facts`, label: `${name} Facts` },
        ]}
      />
      <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-white to-gray-50 shadow-md">
        <div className="border-b bg-white/60 p-8 sm:p-10">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight capitalize">{name} Facts</h1>
        </div>
        <div className="space-y-8 p-8 sm:p-10">
          {facts.length > 0 ? (
            <ul className="list-disc pl-5 space-y-4 text-base md:text-lg leading-relaxed">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          ) : (
            <p className="text-base md:text-lg text-muted-foreground">No facts available.</p>
          )}
          <CTA />
        </div>
      </div>
    </main>
  );
}
