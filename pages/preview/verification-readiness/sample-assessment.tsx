import Head from 'next/head';
import Link from 'next/link';
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

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24 text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 leading-tight max-w-3xl mx-auto">
          Sample VM0007 v1.8 Evidence Readiness Assessment
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
          This redacted sample demonstrates the structure, level of detail, and practical outputs
          of an Article6 assessment.
        </p>
        <p className="mt-3 max-w-xl mx-auto text-sm text-gray-400 leading-relaxed">
          The sample is based on publicly available project documentation. It does not represent
          a commissioned engagement, customer relationship, endorsement, or validation decision.
        </p>
      </section>

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
            <AssessmentStatusCard
              status="unclear"
              title="Carbon-pool selection needs a clearer basis"
              context="Carbon pools included in the accounting boundary, and any exclusions, should be justified against the applicable methodology requirements."
              evidence="The project description and emissions calculations identify the principal pools; supporting rationale for an excluded pool is not consistently referenced."
              gap="The exclusion rationale is stated at a high level, but the supporting source or calculation boundary is not traceable from the reviewed documents."
              whyItMatters="An unsupported exclusion can affect completeness of the baseline and project-emissions assessment."
              requiredAction="Add a pool-by-pool applicability table with the exclusion basis and direct document or calculation references."
              resolution="Every excluded pool has a documented applicability rationale that reconciles to the accounting boundary and cited evidence."
            />
            <AssessmentStatusCard
              status="action-required"
              title="Sampling evidence is not yet demonstrably representative"
              context="Monitoring and field sampling should support representative estimates for the project area and the reported monitoring period."
              evidence="A sampling description and selected observations are present, but the sampling frame, selection method, and coverage by stratum are not fully evidenced."
              gap="The reviewed material does not allow a reviewer to reproduce why the sample is representative of the stated project area."
              whyItMatters="Weak representativeness support can undermine confidence in activity data and uncertainty treatment."
              requiredAction="Provide the sampling frame, stratification logic, sample-size basis, locations or identifiers, and coverage reconciliation."
              resolution="The sampling design and results can be traced from the project area and strata through to the reported estimate."
            />
            <AssessmentStatusCard
              status="unclear"
              title="Requirement references are inconsistent across the evidence set"
              context="The assessment checks whether requirement interpretations and evidence references remain consistent across the PDD, annexes, and calculations."
              evidence="Several sections address the same control or parameter, but they use different internal references and version labels."
              gap="A reviewer may not be able to determine which cited section or calculation is the controlling source."
              whyItMatters="Broken traceability increases review time and makes later corrections harder to propagate safely."
              requiredAction="Create a single reference map and align section, annex, calculation, and methodology-version citations."
              resolution="Each assessed requirement has one unambiguous current reference, with superseded versions identified or removed."
            />
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
        <p className="mt-5 text-sm text-gray-500">
          Reviewing your own project documentation?{' '}
          <Link href="/#upload-pdd" className="font-semibold text-forest-700 hover:text-forest-800">
            Start with a scope review &rarr;
          </Link>
        </p>
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
