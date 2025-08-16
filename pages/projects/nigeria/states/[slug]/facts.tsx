import { useRouter } from "next/router";
import Link from "next/link";

const FACTS: Record<string, string[]> = {
  plateau: [
    "Plateau is known for its scenic rock formations.",
    "It hosts one of Nigeria's most diverse climates.",
    "The state is a major producer of potatoes."
  ]
};

function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StateFactsPage() {
  const router = useRouter();
  const { slug } = router.query;
  const title = typeof slug === "string" ? titleCase(slug) : "";
  const facts = typeof slug === "string" ? FACTS[slug] : undefined;

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Facts: {title}</h1>
      {facts && facts.length > 0 ? (
        <ul className="list-disc pl-6 space-y-1">
          {facts.slice(0, 3).map((fact, idx) => (
            <li key={idx}>{fact}</li>
          ))}
        </ul>
      ) : (
        <p>Register your interest</p>
      )}
      <Link
        href="/contact"
        className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white"
      >
        Book an Expert
      </Link>
    </main>
  );
}

