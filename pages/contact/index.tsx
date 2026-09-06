import Head from 'next/head';
import Link from 'next/link';
import ContactForm from '../../components/ContactForm';

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact Article6</title>
        <meta
          name="description"
          content="Tell Article6 what needs reviewing and what is at stake."
        />
        <link rel="canonical" href="https://www.article6.org/contact" />
      </Head>

      <div className="min-h-screen bg-[#f3f0e9] text-neutral-900">
        <header className="flex items-center justify-between px-[4.2vw] py-8 text-xs tracking-[0.08em]">
          <Link href="/" className="font-semibold tracking-[0.22em]" aria-label="Article6 home">
            ARTICLE6
          </Link>
          <Link href="/" className="text-neutral-600 transition-colors hover:text-black">
            Home
          </Link>
        </header>

        <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-16 px-[6.2vw] pb-24 pt-[8vw] lg:grid-cols-[1.15fr_0.85fr] lg:gap-[10vw] lg:pb-32">
          <section>
            <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              CONTACT ARTICLE6
            </p>
            <h1 className="max-w-4xl text-[clamp(3rem,6vw,7rem)] font-normal leading-[0.95] tracking-[-0.055em]">
              Tell us what needs reviewing and what is at stake.
            </h1>
            <p className="mt-10 max-w-xl text-base leading-7 text-neutral-600 md:text-lg">
              If the work is rules-heavy, evidence-dependent, or expensive to get wrong, send us the context.
            </p>
          </section>

          <section className="self-end border-t border-black/15 pt-8 lg:mt-32">
            <ContactForm />
            <p className="mt-12 text-sm leading-6 text-neutral-500">
              Prefer email?{' '}
              <a className="text-neutral-900 underline underline-offset-4" href="mailto:contact@article6.org">
                contact@article6.org
              </a>
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
