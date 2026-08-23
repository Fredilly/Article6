import React from 'react';

type Status = 'supported' | 'unclear' | 'action-required';

interface AssessmentStatusCardProps {
  status: Status;
  title: string;
  context?: string;
  evidence?: string;
  gap?: string;
  whyItMatters?: string;
  requiredAction?: string;
  resolution?: string;
  children?: React.ReactNode;
}

const statusConfig: Record<Status, { label: string; dotClass: string; borderClass: string }> = {
  supported: {
    label: 'Supported',
    dotClass: 'bg-green-500',
    borderClass: 'border-l-green-500',
  },
  unclear: {
    label: 'Unclear',
    dotClass: 'bg-amber-500',
    borderClass: 'border-l-amber-500',
  },
  'action-required': {
    label: 'Action required',
    dotClass: 'bg-red-500',
    borderClass: 'border-l-red-500',
  },
};

const AssessmentStatusCard: React.FC<AssessmentStatusCardProps> = ({
  status,
  title,
  context,
  evidence,
  gap,
  whyItMatters,
  requiredAction,
  resolution,
  children,
}) => {
  const config = statusConfig[status];

  return (
    <div
      className={`rounded-md border border-gray-200 bg-white p-5 md:p-6 border-l-4 ${config.borderClass}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`h-2.5 w-2.5 rounded-full ${config.dotClass}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {config.label}
        </span>
      </div>
      <h3 className="text-base md:text-lg font-semibold text-forest-900">{title}</h3>
      {children ? (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{children}</p>
      ) : (
      <dl className="mt-4 grid gap-3 text-sm leading-relaxed">
        <div>
          <dt className="font-semibold text-gray-800">Requirement / review context</dt>
          <dd className="text-gray-600">{context}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-800">Evidence reviewed</dt>
          <dd className="text-gray-600">{evidence}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-800">Gap or issue identified</dt>
          <dd className="text-gray-600">{gap}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-800">Why it matters</dt>
          <dd className="text-gray-600">{whyItMatters}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-800">Required action</dt>
          <dd className="text-gray-600">{requiredAction}</dd>
        </div>
        <div>
          <dt className="font-semibold text-gray-800">Resolution criterion</dt>
          <dd className="text-gray-600">{resolution}</dd>
        </div>
      </dl>
      )}
    </div>
  );
};

export default AssessmentStatusCard;
