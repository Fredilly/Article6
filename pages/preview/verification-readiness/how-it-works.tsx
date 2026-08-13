import Head from 'next/head';
import SectionHeading from '../../../components/preview/SectionHeading';
import ProcessStep from '../../../components/preview/ProcessStep';
import Link from 'next/link';
import { useRouter } from 'next/router';

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

      {/* Process */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl mx-auto space-y-8">
          <ProcessStep step={1} title="Share your documents">
            Provide the current PDD and relevant supporting materials through an agreed secure
            channel.
          </ProcessStep>
          <ProcessStep step={2} title="Confirm the scope">
            We verify the methodology, version, project stage, available documentation, and
            assessment scope.
          </ProcessStep>
          <ProcessStep step={3} title="Map requirements to evidence">
            Project documentation is reviewed against the applicable assessment framework.
          </ProcessStep>
          <ProcessStep step={4} title="Review findings and priorities">
            Evidence support, unclear areas, missing information, and preparation actions are
            reviewed.
          </ProcessStep>
          <ProcessStep step={5} title="Deliver the readiness assessment">
            You receive a structured report designed to support internal preparation before
            validation.
          </ProcessStep>
        </div>
      </section>

      {/* Human review */}
      <section className="bg-forest-50/50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading
            heading="Human-reviewed. Methodology-specific. Evidence-focused."
            body="Structured analysis supports the review process, but client-facing conclusions are reviewed before release."
          />
        </div>
      </section>

      {/* Scope */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading heading="What the assessment does not replace" />
        <div className="mt-10 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            'Validation or verification',
            "A VVB's independent judgment",
            'Legal or regulatory advice',
            'Registry review',
            'Project monitoring',
            'A guarantee of approval',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24 text-center">
        <Link
          href={`${base}#upload-pdd`}
          className="inline-flex items-center justify-center rounded-md bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          Upload your PDD
        </Link>
      </section>
    </>
  );
}
