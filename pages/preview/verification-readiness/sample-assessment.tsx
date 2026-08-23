import Head from 'next/head';
import Link from 'next/link';
import ReportPreview from '../../../components/preview/ReportPreview';
import AssessmentStatusCard from '../../../components/preview/AssessmentStatusCard';
import DisclaimerPanel from '../../../components/preview/DisclaimerPanel';
import { useEffect } from 'react';
import { trackEvent } from '../../../lib/analytics';

export default function SampleAssessmentPage() {
  useEffect(() => {
    trackEvent('sample_assessment_view');
  }, []);

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

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
            SAMPLE ASSESSMENT
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-tight md:text-4xl">
            Sample vm0007 1.8 Evidence Readiness Assessment
          </h1>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-gray-600 md:text-base">
          This redacted sample demonstrates the structure, level of detail, and practical outputs of an Article6 assessment.
        </p>
        <p className="mt-3 max-w-xl text-xs leading-relaxed text-gray-400 md:text-sm">
          The sample is based on publicly available project documentation. It does not represent
          a commissioned engagement, customer relationship, endorsement, or validation decision.
        </p>
      </section>

      {/* Report structure */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
            REPORT STRUCTURE
          </p>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
            This is what the analysis looks like.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            The full sample report brings the review record, findings, evidence references, and actions together.
          </p>
        </div>
        <div className="mt-8 max-w-xl">
          <ReportPreview items={reportContents} />
        </div>
      </section>

      {/* Example findings */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
              EXAMPLE FINDINGS
            </p>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
              Findings are organized for resolution.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Each finding connects the requirement, evidence, gap, risk, and action needed to close it.
            </p>
          </div>
          <p className="mt-6 text-xs uppercase tracking-wider text-gray-400">Illustrative examples</p>
          <div className="mt-6 max-w-4xl space-y-5">
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
              title="Sampling design is not sufficiently supported in the PDD"
              context="The PDD should substantiate the sampling and stratification design required by the applicable methodology, including its basis for representativeness."
              evidence="The PDD describes sampling and identifies strata, but the stratification logic and sample-size rationale, where applicable, are not fully supported by internal references."
              gap="The PDD does not make it possible to trace how the proposed design supports representative coverage or remains consistent with the applicable methodology."
              whyItMatters="An under-supported design creates an evidence-readiness gap before a validator can assess whether the PDD's approach is adequately justified."
              requiredAction="Add the design basis, stratification logic, sample-size rationale where applicable, and clear PDD references supporting methodology consistency."
              resolution="The PDD explains the sampling design and representativeness basis, with each element traceable to the applicable methodology and supporting section."
            />
            <AssessmentStatusCard
              status="unclear"
              title="Internal methodology references are inconsistent"
              context="The PDD should use current, unambiguous internal references for each methodology requirement and the evidence supporting it."
              evidence="Several PDD sections address the same requirement, but some section citations and methodology-version references do not align."
              gap="Broken or outdated citations make it unclear which PDD section is the controlling reference for the assessed requirement."
              whyItMatters="A validator may spend additional time resolving traceability defects or question whether the PDD applies the intended methodology version consistently."
              requiredAction="Review the PDD's internal citations, update outdated methodology or version references, and identify one controlling section for each requirement."
              resolution="Each assessed requirement has a current, unambiguous PDD reference, with broken citations corrected and superseded references removed or clearly marked."
            />
          </div>
        </div>
      </section>

      {/* Sample download */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-forest-600">
            TAKE A CLOSER LOOK
          </p>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 md:text-2xl">
            Download the full sample assessment.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
            Review the full vm0007 1.8 pre-validation evidence readiness assessment sample.
          </p>
        <a
          href="https://ik.imagekit.io/tzublgy5d/Article6/Sample%20Documents/VM0007_v1.8_SAMPLE.pdf?ik-attachment=true"
          target="_blank"
          rel="noopener noreferrer"
          download
          onClick={() => trackEvent('sample_pdf_download')}
          className="preview-primary-cta mt-6"
        >
          Download sample report (PDF)
        </a>
        <p className="mt-5 text-sm text-gray-500">
          Ready to review your own project documentation?{' '}
          <Link href="/#upload-pdd" className="preview-focus-ring rounded-sm font-semibold text-forest-700 hover:text-forest-800">
            Upload your PDD &rarr;
          </Link>
        </p>
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
