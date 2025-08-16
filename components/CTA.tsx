import Link from "next/link";

export default function CTA() {
  return (
    <div className="text-center space-y-4">
      <p className="text-base sm:text-lg font-medium">
        Policy maker? We want to hear from you. Register your interest.
      </p>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Book an expert
      </Link>
    </div>
  );
}
