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

      {/* Sample download */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <h2 className="text-xl font-bold text-forest-900">Download Sample Assessment</h2>
        <p className="mt-3 mx-auto max-w-md text-sm text-gray-500">
          Download the full VM0007 v1.8 pre-validation evidence readiness assessment sample.
        </p>
        <a
          href="https://ik.imagekit.io/tzublgy5d/Article6/Sample%20Documents/VM0007_v1.8_SAMPLE.pdf?ik-attachment=true"
          target="_blank"
          rel="noopener noreferrer"
          download
          className="mt-6 inline-flex items-center justify-center rounded-md bg-forest-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800"
        >
          Download Sample Report (PDF)
        </a>
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
