import Head from 'next/head';
import PreviewHero from '../../../components/preview/PreviewHero';
import SectionHeading from '../../../components/preview/SectionHeading';
import ReportPreview from '../../../components/preview/ReportPreview';
import AssessmentStatusCard from '../../../components/preview/AssessmentStatusCard';
import DisclaimerPanel from '../../../components/preview/DisclaimerPanel';

export default function SampleAssessmentPage() {
  const reportContents = [
    'Executive readiness summary',
    'Priority findings',
    'Requirement-by-requirement assessment',
    'Evidence references',
    'Recommended actions',
    'Assessment scope and limitations',
  ];

  return (
    <>
      <Head>
        <title>Sample Evidence Readiness Assessment | Article6</title>
        <meta
          name="description"
          content="Redacted sample demonstrating the structure, detail, and practical outputs of an Article6 evidence readiness assessment."
        />
      </Head>

      <PreviewHero
        headline="Sample VM0007 v1.8 Evidence Readiness Assessment"
        body="This redacted sample demonstrates the structure, level of detail, and practical outputs of an Article6 assessment."
        trustLine="The sample is based on publicly available project documentation. It does not represent a commissioned engagement, customer relationship, endorsement, or validation decision."
      />

      {/* Sample contents */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto">
          <ReportPreview items={reportContents} />
        </div>
      </section>

      {/* Example findings */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <SectionHeading heading="Example findings" />
          <p className="mt-4 text-center text-xs text-gray-400 uppercase tracking-wider">
            Illustrative examples
          </p>
          <div className="mt-10 max-w-3xl mx-auto space-y-5">
            <AssessmentStatusCard status="supported" title="Evidence supported">
              Relevant project documentation was identified and clearly linked to the assessed
              requirement.
            </AssessmentStatusCard>
            <AssessmentStatusCard status="unclear" title="Evidence unclear">
              Related information was located, but the supporting basis or document traceability may
              require clarification.
            </AssessmentStatusCard>
            <AssessmentStatusCard status="action-required" title="Action required">
              Sufficient supporting evidence was not identified in the documents reviewed.
            </AssessmentStatusCard>
          </div>
        </div>
      </section>

      {/* Sample download placeholder */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <h2 className="text-xl font-bold text-forest-900">Download Sample Assessment</h2>
        <p className="mt-3 mx-auto max-w-md text-sm text-gray-500">
          The sample assessment PDF is not yet available. A placeholder has been prepared for the
          approved asset.
        </p>
        <div className="mt-6 inline-flex items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 px-8 py-5 text-sm text-gray-400">
          Sample PDF placeholder — asset pending
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
        <DisclaimerPanel>
          All findings shown are illustrative examples. This sample does not represent a real
          project assessment, engagement, or validation outcome.
        </DisclaimerPanel>
      </section>
    </>
  );
}
