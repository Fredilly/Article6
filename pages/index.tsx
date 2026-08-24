import Head from 'next/head';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Article6</title>
        <meta
          name="description"
          content="Article6 develops specialist review systems for complex, evidence-intensive work."
        />
      </Head>

      <div className="min-h-screen bg-[#f7f7f5] text-[#111111]">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 lg:px-12">
          <a
            href="/"
            className="rounded-md text-[15px] font-semibold tracking-[-0.02em] text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
          >
            Article6
          </a>
          <a
            href="mailto:fredilly@article6.org"
            className="rounded-md text-sm text-[#5f5f5f] transition-colors duration-200 hover:text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
          >
            Contact
          </a>
        </header>

        <main>
          <section className="mx-auto flex min-h-[72vh] max-w-7xl items-center px-6 pb-24 pt-12 md:px-10 md:pb-32 md:pt-20 lg:px-12">
            <div className="max-w-5xl">
              <p className="mb-7 text-xs font-medium uppercase tracking-[0.18em] text-[#777777] md:mb-9">
                Independent review systems
              </p>
              <h1 className="max-w-5xl text-[clamp(3.25rem,8vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.065em] text-[#111111]">
                Complex work deserves a clearer final review.
              </h1>
              <p className="mt-10 max-w-2xl text-lg leading-8 tracking-[-0.015em] text-[#5f5f5f] md:mt-12 md:text-xl md:leading-9">
                Article6 develops specialist review systems for evidence-intensive work where
                requirements, supporting documentation and external scrutiny need to align.
              </p>
            </div>
          </section>

          <section className="border-t border-black/10">
            <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:px-12">
              <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#777777]">
                    The principle
                  </p>
                </div>
                <div className="max-w-3xl">
                  <h2 className="text-3xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
                    Find the weakness while it can still be fixed.
                  </h2>
                  <p className="mt-7 max-w-2xl text-base leading-7 text-[#666666] md:text-lg md:leading-8">
                    Important submissions rarely fail because information is completely absent.
                    More often, requirements are interpreted differently, evidence is difficult to
                    trace, or a claim is not supported as clearly as the reviewer expects.
                  </p>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-[#666666] md:text-lg md:leading-8">
                    We move that scrutiny earlier, before external review makes ambiguity more
                    expensive.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-black/10 bg-[#111111] text-white">
            <div className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28 lg:px-12">
              <div className="max-w-4xl">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
                  How we think
                </p>
                <p className="mt-8 text-[clamp(2rem,5vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.05em] text-white">
                  Requirements should be traceable. Evidence should be defensible. Review should
                  happen before the stakes are highest.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-black/10 bg-[#f7f7f5]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-xs text-[#777777] sm:flex-row sm:items-center sm:justify-between md:px-10 lg:px-12">
            <p>© {new Date().getFullYear()} Article6.</p>
            <a
              href="mailto:fredilly@article6.org"
              className="rounded-sm transition-colors duration-200 hover:text-[#111111] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#111111]"
            >
              fredilly@article6.org
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
