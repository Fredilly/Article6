import React from 'react';

interface ProcessStepProps {
  step: number;
  title: string;
  children: React.ReactNode;
}

const ProcessStep: React.FC<ProcessStepProps> = ({ step, title, children }) => {
  return (
    <div className="flex gap-5">
      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-forest-600 text-white text-sm font-bold">
        {step}
      </div>
      <div>
        <h4 className="text-base md:text-lg font-semibold text-forest-900">{title}</h4>
        <p className="mt-2 text-sm md:text-base text-gray-600 leading-relaxed">{children}</p>
      </div>
    </div>
  );
};

export default ProcessStep;
