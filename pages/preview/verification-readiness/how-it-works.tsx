import Head from 'next/head';
import ProcessStep from '../../../components/preview/ProcessStep';
import EvidenceMapPreview from '../../../components/preview/EvidenceMapPreview';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { trackEvent } from '../../../lib/analytics';

export default function HowItWorksPage() {
  const router = useRouter();
  const base = router.pathname.startsWith('/preview/verification-readiness')
    ? '/preview/verification-readiness'
    : '/';

  return (
    <>
      <Head>
        <title>How the Assessment Works | Article6</title>
        <meta
          name="description"
          content="A clear process from project documents to a reviewed readiness report."
        />
      </Head>

      {/* Introduction and process */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
            HOW IT WORKS
          </p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl">
            From PDD to a clear validation-readiness plan.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
            Article6 maps methodology requirements to project evidence, identifies gaps, and provides preparation actions.
          </p>
        </div>

        <div className="mt-10 max-w-3xl space-y-6 md:mt-12">
          <ProcessStep step={1} title="Share your documents">
            Share the current PDD and relevant supporting materials through an agreed secure channel.
          </ProcessStep>
          <ProcessStep step={2} title="Confirm the scope">
            Confirm the methodology, version, project stage, and assessment scope.
          </ProcessStep>
          <ProcessStep step={3} title="Map requirements to evidence">
            Trace applicable requirements to the evidence in your project documentation.
          </ProcessStep>
          <ProcessStep step={4} title="Review findings and priorities">
            Review supported, unclear, and action-required areas with their priorities.
          </ProcessStep>
          <ProcessStep step={5} title="Deliver the readiness assessment">
            Receive a structured report with preparation actions before validation begins.
          </ProcessStep>
        </div>
      </section>

      {/* Evidence map */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
              THE REVIEW IN PRACTICE
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
              The evidence map turns the review into a working plan.
            </h2>
          </div>
          <div className="mt-8">
            <EvidenceMapPreview />
          </div>
        </div>
      </section>

      {/* Human review */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 md:text-xl">
            Human-reviewed. Methodology-specific. Evidence-focused.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            Structured analysis supports the review process, but client-facing conclusions are reviewed before release.
          </p>
        </div>
      </section>

      {/* Scope */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
            SCOPE CLARIFICATION
          </p>
          <h2 className="mt-2 text-base font-semibold tracking-tight text-gray-800">
            What the assessment does not replace
          </h2>
          <div className="mt-5 grid max-w-3xl grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
          {[
            'Validation or verification',
            "A VVB's independent judgment",
            'Legal or regulatory advice',
            'Registry review',
            'Project monitoring',
            'A guarantee of approval',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
              <span aria-hidden="true" className="mt-1 h-1 w-1 shrink-0 rounded-full bg-gray-400" />
              <span>{item}</span>
            </div>
          ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
            NEXT STEP
          </p>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
            Start with your project documentation.
          </h2>
        </div>
        <Link
          href={`${base}#upload-pdd`}
          onClick={() => trackEvent('homepage_primary_cta', { location: 'mid_page' })}
          className="preview-primary-cta mt-6"
        >
          Upload your PDD
        </Link>
      </section>
    </>
  );
}
