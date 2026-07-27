import Head from 'next/head';
import PreviewHero from '../../../components/preview/PreviewHero';
import SectionHeading from '../../../components/preview/SectionHeading';
import AssessmentStatusCard from '../../../components/preview/AssessmentStatusCard';
import DisclaimerPanel from '../../../components/preview/DisclaimerPanel';
import Link from 'next/link';

const BASE = '/preview/verification-readiness';

export default function VM0007Page() {
  return (
    <>
      <Head>
        <title>VM0007 v1.8 Evidence Readiness Assessment | Article6</title>
        <meta
          name="description"
          content="Evidence readiness assessment for REDD+ project documentation using Verra VM0007 v1.8."
        />
      </Head>

      <PreviewHero
        eyebrow="METHODOLOGY-SPECIFIC ASSESSMENT"
        headline="VM0007 v1.8 Evidence Readiness Assessment"
        body="For REDD+ project teams preparing documentation under Verra VM0007 v1.8."
        supportingText="We help identify where evidence appears well supported, where it remains unclear, and what may require additional preparation before validation."
        primaryCta={{ label: 'Request an Assessment', href: `${BASE}/request-assessment` }}
      />

      {/* What we review */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading heading="What we review" />
        <div className="mt-10 max-w-2xl mx-auto space-y-3">
          {[
            'Project documentation against the applicable assessment framework',
            'Evidence availability and traceability',
            'Missing or incomplete supporting information',
            'Areas that may require clarification',
            'Project-specific preparation needs',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm md:text-base text-gray-700">
              <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* What the client receives */}
      <section className="bg-forest-50/50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading heading="What you receive" />
          <div className="mt-10 max-w-2xl mx-auto space-y-3">
            {[
              'Executive readiness summary',
              'Requirement-by-requirement evidence assessment',
              'Priority preparation gaps',
              'Recommended actions',
              'Reviewed PDF report',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm md:text-base text-gray-700">
                <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is required */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <SectionHeading heading="What we need from you" />
        <div className="mt-10 max-w-2xl mx-auto space-y-3">
          {[
            'Current PDD',
            'Methodology and version details',
            'Registry or project identifier, where available',
            'Relevant supporting documents',
            'Project contact for clarification',
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 text-sm md:text-base text-gray-700">
              <span className="mt-0.5 text-forest-600 font-bold">&#x2022;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Assessment statuses */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading heading="Clear, reviewable findings" />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <AssessmentStatusCard status="supported" title="Evidence supported">
              Relevant evidence was identified and appears to address the assessed requirement.
            </AssessmentStatusCard>
            <AssessmentStatusCard status="unclear" title="Evidence unclear">
              Relevant information was identified, but its support, clarity, or traceability may
              require further review.
            </AssessmentStatusCard>
            <AssessmentStatusCard status="action-required" title="Action required">
              Evidence was not identified or appears insufficient for the assessed requirement.
            </AssessmentStatusCard>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <DisclaimerPanel>
          This is an independent pre-validation evidence readiness assessment. It is not validation,
          verification, legal advice, a registry determination, or a guarantee of acceptance by
          Verra or any validation and verification body.
        </DisclaimerPanel>
      </section>
    </>
  );
}
