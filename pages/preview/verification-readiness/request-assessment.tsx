import Head from 'next/head';
import PreviewHero from '../../../components/preview/PreviewHero';
import AssessmentRequestForm from '../../../components/preview/AssessmentRequestForm';
import SectionHeading from '../../../components/preview/SectionHeading';
import ProcessStep from '../../../components/preview/ProcessStep';

export default function RequestAssessmentPage() {
  return (
    <>
      <Head>
        <title>Request an Evidence Readiness Assessment | Article6</title>
        <meta
          name="description"
          content="Share project details and request an Article6 evidence readiness assessment."
        />
      </Head>

      <PreviewHero
        headline="Request an Evidence Readiness Assessment"
        body="Share a few project details. We will review the request and confirm whether it fits the current VM0007 v1.8 assessment scope."
      />

      {/* Form */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
            <AssessmentRequestForm />
          </div>

          <p className="mt-8 text-center text-sm text-gray-500">
            Prefer to speak with us?{' '}
            <a href="mailto:contact@article6.org" className="text-forest-700 hover:text-forest-800 font-medium">
              contact@article6.org
            </a>
          </p>
        </div>
      </section>

      {/* What happens next */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading heading="What happens next" />
          <div className="mt-12 max-w-lg mx-auto space-y-6">
            <ProcessStep step={1} title="Request review">
              We review the request and confirm the scope.
            </ProcessStep>
            <ProcessStep step={2} title="Scope confirmation">
              We explain the next steps and applicable pricing.
            </ProcessStep>
            <ProcessStep step={3} title="Document intake">
              Documents are shared through an agreed secure process.
            </ProcessStep>
            <ProcessStep step={4} title="Assessment delivery">
              The assessment is completed and the report is delivered.
            </ProcessStep>
          </div>
        </div>
      </section>
    </>
  );
}
