import Head from 'next/head';
import PreviewHero from '../../../components/preview/PreviewHero';
import SectionHeading from '../../../components/preview/SectionHeading';
import FeatureCard from '../../../components/preview/FeatureCard';
import ProcessStep from '../../../components/preview/ProcessStep';
import Link from 'next/link';

const BASE = '/preview/verification-readiness';

export default function PreviewHomePage() {
  return (
    <>
      <Head>
        <title>Article6 Verification Readiness Preview</title>
        <meta
          name="description"
          content="Article6 evidence readiness assessments for carbon projects preparing for validation."
        />
      </Head>

      {/* Hero */}
      <PreviewHero
        eyebrow="VM0007 v1.8 EVIDENCE READINESS"
        headline="Prepare your carbon project for validation."
        body="Article6 reviews project documentation against methodology requirements and identifies evidence gaps before validation."
        supportingText="Currently supporting Verra VM0007 v1.8 REDD+ projects."
        primaryCta={{ label: 'Request an Assessment', href: `${BASE}/request-assessment` }}
        secondaryCta={{ label: 'View Sample Assessment', href: `${BASE}/sample-assessment` }}
      />

      {/* Problem section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading
          heading="Validation problems start before the audit."
        />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard title="Evidence is scattered">
            Critical evidence can be distributed across the PDD, annexes, calculations, maps, and
            supporting documents.
          </FeatureCard>
          <FeatureCard title="Requirements are complex">
            Methodology requirements must be interpreted consistently and connected to traceable
            project evidence.
          </FeatureCard>
          <FeatureCard title="Late findings are expensive">
            Issues discovered during validation can create avoidable clarification cycles, rework,
            and delays.
          </FeatureCard>
        </div>
      </section>

      {/* Solution section */}
      <section className="bg-forest-50/50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading
            heading="The Article6 Evidence Readiness Assessment"
            body="We map project documentation against methodology requirements and produce a clear, actionable readiness assessment before external validation."
          />
          <div className="mt-12 max-w-2xl mx-auto">
            <ul className="space-y-4 text-sm md:text-base text-gray-700">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                Requirement-by-requirement review
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                Evidence coverage assessment
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                Priority gaps and risks
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                Recommended preparation actions
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                Reviewed readiness report
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Process section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading
          heading="From project documents to a readiness report"
        />
        <div className="mt-12 max-w-2xl mx-auto space-y-8">
          <ProcessStep step={1} title="Share your PDD">
            Upload the current PDD and relevant supporting documents.
          </ProcessStep>
          <ProcessStep step={2} title="We analyze the requirements">
            We map methodology requirements to the documents provided.
          </ProcessStep>
          <ProcessStep step={3} title="Evidence is reviewed">
            Evidence availability, clarity, traceability, and support are assessed.
          </ProcessStep>
          <ProcessStep step={4} title="Findings are prioritized">
            Potential gaps, unclear areas, and preparation needs are identified.
          </ProcessStep>
          <ProcessStep step={5} title="You receive the report">
            The final assessment provides structured findings and recommended actions.
          </ProcessStep>
        </div>
      </section>

      {/* Audience section */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading
            heading="Built for teams preparing carbon projects for validation"
          />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard title="Project developers">
              Identify evidence gaps before they become validation findings.
            </FeatureCard>
            <FeatureCard title="Carbon consultants">
              Add structured methodology evidence review to project preparation work.
            </FeatureCard>
            <FeatureCard title="In-house technical teams">
              Improve documentation readiness before external review.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* Methodology section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading heading="Current methodology coverage" />
        <div className="mt-12 max-w-md mx-auto">
          <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-forest-900">VM0007 v1.8</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Evidence readiness assessment for REDD+ project documentation using Verra VM0007 v1.8.
            </p>
            <Link
              href={`${BASE}/vm0007`}
              className="mt-4 inline-flex text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors"
            >
              View the VM0007 assessment &rarr;
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-400 text-center leading-relaxed">
            Additional methodologies will be introduced only after they are fully reviewed and supported.
          </p>
        </div>
      </section>

      {/* Trust section */}
      <section className="bg-forest-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Evidence before claims
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="rounded-lg border border-forest-700 bg-forest-800/50 p-5">
              <p className="text-sm leading-relaxed text-forest-100">Human-reviewed conclusions</p>
            </div>
            <div className="rounded-lg border border-forest-700 bg-forest-800/50 p-5">
              <p className="text-sm leading-relaxed text-forest-100">Traceable source references</p>
            </div>
            <div className="rounded-lg border border-forest-700 bg-forest-800/50 p-5">
              <p className="text-sm leading-relaxed text-forest-100">Methodology-specific analysis</p>
            </div>
            <div className="rounded-lg border border-forest-700 bg-forest-800/50 p-5">
              <p className="text-sm leading-relaxed text-forest-100">Clear separation from VVB decisions</p>
            </div>
            <div className="rounded-lg border border-forest-700 bg-forest-800/50 p-5">
              <p className="text-sm leading-relaxed text-forest-100">No guarantee of validation or registry acceptance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-forest-900">
          Send us your PDD.
        </h2>
        <p className="mt-4 mx-auto max-w-xl text-base md:text-lg text-gray-600 leading-relaxed">
          We will review the project scope, confirm whether it fits the current assessment, and
          explain the next steps.
        </p>
        <Link
          href={`${BASE}/request-assessment`}
          className="mt-8 inline-flex items-center justify-center rounded-md bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          Request an Assessment
        </Link>
      </section>
    </>
  );
}
