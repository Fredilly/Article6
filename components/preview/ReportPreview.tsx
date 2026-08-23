import React from 'react';

interface ReportPreviewProps {
  items: string[];
  className?: string;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({ items, className = '' }) => {
  return (
    <div className={`overflow-hidden rounded-md border border-gray-200 bg-white ${className}`}>
      <div className="bg-forest-900 px-6 py-10 md:px-10 md:py-16 text-white">
        <div className="max-w-sm mx-auto text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-forest-200 mb-3">Evidence Readiness Assessment</div>
          <div className="text-xl md:text-2xl font-bold leading-tight">vm0007 1.8</div>
          <div className="text-forest-200 text-sm mt-2">Sample Assessment Report</div>
          <div className="mt-6 border-t border-forest-600 pt-4 text-xs text-forest-200">
            Prepared by Article6
          </div>
        </div>
      </div>
      <div className="p-6 md:p-8">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">Contents</h3>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-0.5 flex-shrink-0 text-forest-600">&#x2022;</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportPreview;
