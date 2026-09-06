import Head from 'next/head';
import Link from 'next/link';

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': 'https://www.article6.org/approach#service',
  name: 'Independent specialist review for high-consequence documents',
  serviceType: 'Independent specialist document review',
  provider: {
    '@id': 'https://www.article6.org/#organization',
  },
  url: 'https://www.article6.org/approach',
  description:
    'Article6 applies a structured independent review process to complex, evidence-dependent documents where requirements, evidence and judgment determine the outcome.',
};

export default function ApproachPage() {
  const steps = [
    ['01', 'Requirements', 'Identify the rules, criteria and conditions the work must satisfy.'],
    ['02', 'Claims', 'Separate what the document says from what it must actually prove.'],
    ['03', 'Evidence', 'Test whether the supporting material is specific, complete and relevant.'],
    ['04', 'Consistency', 'Check for contradictions, omissions and unsupported assumptions.'],
    ['05', 'Judgment', 'Apply independent review where the rules still require interpretation.'],
    ['06', 'Resolution', 'Return prioritized findings, required actions and clear resolution criteria.'],
  ];

  return (
    <>
      <Head>
        <title>Article6 Approach — Independent specialist review</title>
        <meta
          name="description"
          content="How Article6 reviews complex, evidence-dependent documents: requirements, claims, evidence, consistency, judgment and resolution."
        />
        <link rel="canonical" href="https://www.article6.org/approach" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      </Head>

      <div className="min-h-screen bg-[#f3f0e9] text-neutral-900">
        <header className="flex items-center justify-between px-[4.2vw] py-8 text-xs tracking-[0.08em]">
          <Link href="/" className="font-semibold tracking-[0.22em]" aria-label="Article6 home">
            ARTICLE6
          </Link>
          <nav className="flex items-center gap-6 text-neutral-600">
            <Link href="/">Home</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>

        <main>
          <section className="grid grid-cols-1 gap-14 border-b border-black/15 px-[6.2vw] pb-[10vw] pt-[8vw] lg:grid-cols-[1.35fr_0.65fr] lg:gap-[10vw]">
            <div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                THE ARTICLE6 APPROACH
              </p>
              <h1 className="max-w-5xl text-[clamp(3rem,6vw,7rem)] font-normal leading-[0.95] tracking-[-0.055em]">
                Independent review, structured around what must be true.
              </h1>
            </div>
            <div className="self-end text-base leading-7 text-neutral-600 md:text-lg">
              <p>
                Article6 reviews high-consequence documents by separating requirements, claims, evidence and judgment before identifying what still needs attention.
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 border-b border-black/15 md:grid-cols-2 xl:grid-cols-3">
            {steps.map(([number, title, body]) => (
              <article key={title} className="min-h-[300px] border-b border-black/15 px-[4.2vw] py-14 md:border-r xl:min-h-[340px]">
                <p className="mb-12 text-[10px] font-semibold tracking-[0.18em] text-neutral-500">{number}</p>
                <h2 className="text-[clamp(2rem,3vw,3.6rem)] font-normal tracking-[-0.05em]">{title}.</h2>
                <p className="mt-14 max-w-md leading-7 text-neutral-600">{body}</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-14 px-[6.2vw] py-[10vw] lg:grid-cols-[1.35fr_0.65fr] lg:gap-[10vw]">
            <div>
              <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                WHAT THE REVIEW PRODUCES
              </p>
              <h2 className="max-w-4xl text-[clamp(2.8rem,5vw,5.8rem)] font-normal leading-[0.98] tracking-[-0.05em]">
                Findings that can be acted on.
              </h2>
            </div>
            <div className="self-end text-base leading-7 text-neutral-600 md:text-lg">
              <p>
                The output is designed to show what matters, why it matters, what needs to change and what would count as resolved.
              </p>
              <Link
                href="/contact"
                className="mt-10 inline-flex items-center gap-4 border-b border-black pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-900"
              >
                Work with Article6 <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
