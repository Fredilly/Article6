import Link from "next/link";

export default function CTA() {
  return (
    <div className="text-center space-y-6">
      <p className="mx-auto max-w-2xl text-lg md:text-xl font-medium">
        Policy maker? We want to hear from you. Register your interest.
      </p>
      <Link
        href="/contact"
        className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-base font-medium text-white hover:opacity-90"
      >
        Book an expert
      </Link>
    </div>
  );
}
