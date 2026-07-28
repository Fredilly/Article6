import PreviewHero from './preview/PreviewHero';
import PddUploadForm from './preview/PddUploadForm';
import Link from 'next/link';

const SAMPLE_ASSESSMENT_PATH = '/preview/verification-readiness/sample-assessment';

export default function VerificationReadinessHome() {
  return (
    <>
      {/* 1. Hero */}
      <PreviewHero
        eyebrow="VM0007 v1.8 EVIDENCE READINESS"
        headline="Find the evidence gaps before your validator does."
        body="Article6 reviews your VM0007 v1.8 project documentation against methodology requirements to identify missing, unclear, and unsupported evidence before validation begins."
        trustLine="Independent pre-validation review. No commitment required for initial scope review."
        primaryCta={{ label: 'Upload your PDD', href: '#upload-pdd' }}
        secondaryCta={{ label: 'View Sample Assessment', href: SAMPLE_ASSESSMENT_PATH }}
      >
        {/* Premium report preview */}
        <div className="w-full max-w-[320px] lg:max-w-full">
          <div className="rounded-md border border-gray-200 bg-white shadow-md overflow-hidden">
            {/* Cover header */}
            <div className="bg-forest-900 px-6 py-7">
              <div className="border border-forest-600/40 px-4 py-5 text-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-forest-300">Article6</p>
                <p className="text-xl font-bold text-white mt-3 leading-tight">
                  VM0007 v1.8
                </p>
                <p className="text-xs text-forest-200 mt-1">
                  REDD+ Methodology Framework
                </p>
                <div className="mt-4 w-12 h-px bg-forest-600 mx-auto" />
                <p className="text-xs text-forest-200 mt-3">
                  Pre-Validation
                </p>
                <p className="text-xs text-forest-200">
                  Evidence Assessment
                </p>
                <p className="text-[10px] text-forest-400 mt-3">
                  Illustrative Client Deliverable
                </p>
              </div>
            </div>

            {/* Dashboard summary */}
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3">
                Readiness Dashboard
              </p>
              <p className="text-xs text-gray-500 mb-3">
                58 methodology requirements reviewed
              </p>
              <div className="space-y-2">
                {[
                  { label: 'FOUND', count: 6, w: 'w-[10%]', bg: 'bg-green-500', text: 'text-green-700' },
                  { label: 'UNCLEAR', count: 21, w: 'w-[36%]', bg: 'bg-amber-400', text: 'text-amber-700' },
                  { label: 'MISSING', count: 9, w: 'w-[16%]', bg: 'bg-red-400', text: 'text-red-700' },
                  { label: 'NOT APPLICABLE', count: 22, w: 'w-[38%]', bg: 'bg-gray-300', text: 'text-gray-500' },
                ].map(({ label, count, w, bg, text }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="text-[11px] text-gray-600 w-[72px] shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bg} ${w}`} />
                    </div>
                    <span className={`text-[11px] font-semibold ${text} w-5 text-right`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Outcomes */}
            <div className="px-5 py-3 border-b border-gray-100">
              <div className="flex gap-5 text-center text-[11px]">
                <div>
                  <span className="font-bold text-green-700">6</span>
                  <p className="text-gray-400 text-[10px] mt-0.5">CONFORMS</p>
                </div>
                <div>
                  <span className="font-bold text-red-600">30</span>
                  <p className="text-gray-400 text-[10px] mt-0.5">ACTION REQ.</p>
                </div>
                <div>
                  <span className="font-bold text-gray-400">22</span>
                  <p className="text-gray-400 text-[10px] mt-0.5">NOT APPLIC.</p>
                </div>
              </div>
            </div>

            {/* Footer disclaimer */}
            <div className="px-5 py-3 bg-gray-50">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Pre-validation readiness assessment. Not validation approval,
                verification, or certification.
              </p>
              <p className="text-[10px] text-gray-300 mt-1">
                Sample for illustration.
              </p>
            </div>
          </div>
        </div>
      </PreviewHero>

      {/* 2. Why this matters */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
            A complete PDD does not always mean a validation-ready project.
          </h2>
          <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed">
            Carbon projects often contain extensive documentation, but evidence can still be
            incomplete, unclear, or difficult for reviewers to trace.
          </p>
        </div>
        <div className="mt-8 space-y-3 max-w-2xl">
          {[
            'Evidence is distributed across PDDs, annexes, calculations, maps, and supporting files.',
            'Requirements may be addressed without sufficient supporting evidence.',
            'Evidence may exist but be difficult to verify or trace.',
            'Documentation gaps are often discovered after validation has already started.',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-sm text-gray-700 leading-relaxed">
              <span className="mt-0.5 flex-shrink-0 text-forest-600 font-bold">&#x2713;</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Cost of doing nothing */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
            Finding gaps during validation costs more.
          </h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Clarification cycles</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Your team spends time responding to questions and locating additional evidence.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Rework</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Documentation must be revised under external review pressure.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delays</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Unresolved evidence questions can slow validation progress.
              </p>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500 max-w-2xl">
            Article6 moves that review forward, while your team still has time to prepare.
          </p>
        </div>
      </section>

      {/* 4. What you receive */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
              A clear preparation plan before validation.
            </h2>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {[
                'Requirement-by-requirement evidence assessment',
                'Supported, unclear, and action-required findings',
                'Evidence references and traceability notes',
                'Priority preparation actions',
                'Reviewed readiness report',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 text-forest-600 font-bold">&#x2713;</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              href={SAMPLE_ASSESSMENT_PATH}
              className="mt-6 inline-flex items-center text-sm font-medium text-forest-700 hover:text-forest-800 transition-colors"
            >
              View Sample Assessment &rarr;
            </Link>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden max-w-xs">
              <div className="bg-gradient-to-br from-forest-700 to-forest-900 px-5 py-6 text-white text-center">
                <p className="text-xs uppercase tracking-[0.15em] text-forest-200">
                  Evidence Readiness Assessment
                </p>
                <p className="text-lg font-bold mt-1.5">VM0007 v1.8</p>
                <p className="text-forest-200 text-xs mt-1">Sample Report</p>
                <div className="mt-4 border-t border-forest-600 pt-3 text-[10px] text-forest-200">
                  Prepared by Article6
                </div>
              </div>
              <div className="px-5 py-4 space-y-1.5">
                {[
                  'Executive readiness summary',
                  'Priority findings',
                  'Requirement-by-requirement assessment',
                  'Evidence references',
                  'Recommended actions',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="text-forest-600">&#x2713;</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PDD upload form */}
      <section id="upload-pdd" className="border-y border-gray-200 bg-gray-50 scroll-mt-16">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
          <div className="max-w-lg mx-auto">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
              Send us your PDD.
            </h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              Upload your project documentation and we will review the scope, confirm methodology
              fit, and explain the next steps.
            </p>

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
              <PddUploadForm />
            </div>

            <div className="mt-6 text-xs text-gray-500 leading-relaxed">
              <p>
                Your document will be used only to evaluate and perform the requested assessment.
                All uploads are transmitted securely and stored privately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Disclaimer */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto rounded-lg border border-gray-200 bg-gray-50 p-5 md:p-6 text-sm text-gray-500 leading-relaxed">
          Article6 provides independent pre-validation evidence readiness assessments. The service is
          not validation, verification, legal advice, a registry determination, or a guarantee of
          acceptance by Verra or any validation and verification body.
        </div>
      </section>
    </>
  );
}
