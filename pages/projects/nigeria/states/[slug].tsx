import { useRouter } from "next/router";
import Link from "next/link";

function titleCase(value: string): string {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StateDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const title = typeof slug === "string" ? titleCase(slug) : "";

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">State: {title}</h1>
      <Link
        href="/contact"
        className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white"
      >
        Book an Expert
      </Link>
    </main>
  );
}

