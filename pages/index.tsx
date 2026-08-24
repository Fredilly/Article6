import Head from 'next/head';
import Typewriter from 'typewriter-effect';
import Logo from '../components/Logo';

const TYPEWRITER_LINES = [
  'reviews complex submissions.',
  'maps requirements to evidence.',
  'finds weaknesses before external review.',
];

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

      <div
        className="flex min-h-screen flex-col bg-white"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:py-3.5">
            <Logo href="/" />
            <a href="mailto:fredilly@article6.org" className="preview-primary-cta">
              Contact
            </a>
          </nav>
        </header>

        <main className="flex-grow">
          <section className="relative overflow-hidden bg-white">
            <div className="mx-auto max-w-6xl px-4 py-12 md:py-20 lg:py-24">
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-5 lg:gap-16">
                <div className="lg:col-span-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
                    Independent review systems
                  </p>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
                    <span className="block">Article6</span>
                    <span className="block text-forest-700" aria-live="polite">
                      <Typewriter
                        options={{
                          strings: TYPEWRITER_LINES,
                          autoStart: true,
                          loop: true,
                          delay: 55,
                          deleteSpeed: 28,
                          cursor: '|',
                        }}
                      />
                    </span>
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-gray-600 md:text-base">
                    We develop specialist review systems for evidence-intensive work where
                    requirements, supporting documentation and external scrutiny need to align.
                  </p>
                  <p className="mt-5 max-w-md text-xs leading-relaxed text-gray-400">
                    Independent review before the work reaches external scrutiny.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-y border-gray-200 bg-gray-50">
            <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
              <div className="max-w-2xl">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
                  THE PRINCIPLE
                </p>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                  Find the weakness while it can still be fixed.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 md:text-base">
                  Requirements can be interpreted differently. Evidence can exist but be difficult
                  to trace. Claims can look complete while still leaving unanswered questions.
                </p>
                <p className="mt-3 text-sm font-medium leading-relaxed text-forest-800">
                  Article6 moves that scrutiny earlier.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
                  THE WORK
                </p>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
                  Requirements. Evidence. Independent review.
                </h2>
              </div>
              <div className="space-y-4 text-sm leading-relaxed text-gray-600 md:text-base">
                <p>
                  We focus on complex work where the quality of a submission depends on whether the
                  underlying requirements and supporting evidence actually line up.
                </p>
                <p>
                  The goal is simple: identify avoidable weaknesses before they become external
                  review problems.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
            <Logo href="/" />
            <p className="mt-2 max-w-md text-sm text-gray-500">
              Independent review systems for complex, evidence-intensive work.
            </p>
            <a
              href="mailto:fredilly@article6.org"
              className="preview-focus-ring mt-5 inline-flex rounded-sm text-xs text-gray-500 transition-colors hover:text-forest-700"
            >
              fredilly@article6.org
            </a>
            <div className="mt-6 border-t border-gray-100 pt-5 text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Article6. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
