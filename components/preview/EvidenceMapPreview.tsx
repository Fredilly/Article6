import React from 'react';

const stages = [
  { number: '01', label: 'PDD uploaded', detail: 'Project documentation received' },
  { number: '02', label: 'Methodology requirements checked', detail: 'Applicable criteria reviewed' },
  { number: '03', label: 'Evidence mapped', detail: 'Sources traced to requirements' },
  { number: '04', label: 'Risks identified', detail: 'Gaps rated by review priority' },
  { number: '05', label: 'Actions recommended', detail: 'Resolution guidance prepared' },
];

const evidenceSources = ['PDD Section 3.2', 'Supporting documentation'];

export default function EvidenceMapPreview() {
  return (
    <div className="overflow-hidden rounded-md border border-gray-300 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-forest-600">
            Illustrative review record
          </p>
          <h3 className="mt-1 text-base font-semibold text-gray-900">Evidence map</h3>
        </div>
        <span className="self-start rounded-sm border border-gray-300 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:self-auto">
          Sample data
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="border-b border-gray-200 px-5 py-6 lg:border-b-0 lg:border-r lg:px-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Review path
          </p>
          <ol className="mt-5 space-y-0">
            {stages.map((stage, index) => (
              <li key={stage.number} className="relative flex gap-3 pb-5 last:pb-0">
                {index < stages.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[11px] top-6 h-[calc(100%-10px)] w-px bg-forest-200" />
                )}
                <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-forest-300 bg-white text-[9px] font-semibold text-forest-700">
                  {stage.number}
                </span>
                <span className="min-w-0 pt-0.5">
                  <span className="block text-sm font-semibold text-gray-900">{stage.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{stage.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="px-5 py-6 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                Requirement review
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">Applicable methodology</p>
            </div>
            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
              Medium risk
            </span>
          </div>

          <dl className="mt-5 divide-y divide-gray-100 border-y border-gray-100">
            <div className="py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Requirement</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-800">Baseline scenario justification</dd>
            </div>
            <div className="py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Evidence reviewed</dt>
              <dd className="mt-1 space-y-1 text-sm text-gray-800">
                {evidenceSources.map((source) => (
                  <div key={source} className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-500" />
                    <span>{source}</span>
                  </div>
                ))}
              </dd>
            </div>
            <div className="py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Assessment</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-800">Additional support recommended</dd>
            </div>
            <div className="py-3">
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Action</dt>
              <dd className="mt-1 text-sm leading-relaxed text-gray-800">Provide stronger supporting evidence before validation.</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
