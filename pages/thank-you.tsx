import Link from "next/link";

export default function ThankYouPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Thank you</h1>
      <p className="mt-3 text-base text-muted-foreground">
        We will get back to you within 48 hours.
      </p>
      <Link href="/" className="inline-flex mt-6 items-center rounded-xl border px-4 py-2 text-sm hover:bg-accent">
        ← Back to Home
      </Link>
    </main>
  );
}

