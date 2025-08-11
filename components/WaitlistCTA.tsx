import Link from 'next/link';

export default function WaitlistCTA() {
  return (
    <section className="rounded-2xl border bg-white shadow-sm p-8 text-center">
      <h3 className="text-lg md:text-xl font-medium">Reserve Your Place</h3>
      <p className="mt-2 text-sm text-gray-700">
        We are onboarding a limited number of state programs in 2025. Join the waitlist to secure your slot.
      </p>
      <Link href="/contact" className="inline-block mt-4 rounded-xl px-5 py-3 border bg-black text-white">
        Join the Waitlist
      </Link>
    </section>
  );
}
