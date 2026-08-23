import React from 'react';

const findings = [
  {
    requirement: 'Project boundary definition',
    evidence: 'PDD Section 1.4; project boundary map',
    finding: 'Boundary description is present, but the map does not identify all included facilities.',
    risk: 'Medium',
    action: 'Reconcile the map and narrative before submission.',
  },
  {
    requirement: 'Monitoring parameter sources',
    evidence: 'Monitoring plan; equipment specification sheet',
    finding: 'The monitoring plan names the parameter but does not show the source of the measurement factor.',
    risk: 'High',
    action: 'Add the source and explain how the factor will be verified.',
  },
  {
    requirement: 'Stakeholder consultation record',
    evidence: 'Consultation minutes; attendance register',
    finding: 'Meeting records are included, though responses to material concerns are not traceable.',
    risk: 'Low',
    action: 'Link each material concern to a response or resolution note.',
  },
];

const riskStyles: Record<string, string> = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function SampleFindings() {
  return (
    <div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {findings.map((finding) => (
          <article key={finding.requirement} className="flex h-full flex-col border-t-2 border-forest-200 bg-gray-50 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold leading-snug text-gray-900">{finding.requirement}</h3>
              <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${riskStyles[finding.risk]}`}>
                {finding.risk}
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-xs leading-relaxed">
              <div>
                <dt className="font-semibold uppercase tracking-wider text-gray-400">Evidence reviewed</dt>
                <dd className="mt-1 text-gray-700">{finding.evidence}</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wider text-gray-400">Finding</dt>
                <dd className="mt-1 text-gray-700">{finding.finding}</dd>
              </div>
              <div className="mt-auto border-t border-gray-200 pt-3">
                <dt className="font-semibold uppercase tracking-wider text-gray-400">Recommended action</dt>
                <dd className="mt-1 text-gray-800">{finding.action}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-gray-400">Illustrative findings for demonstration only. Not from a real client project.</p>
    </div>
  );
}
