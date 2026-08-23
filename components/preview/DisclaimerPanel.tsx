import React from 'react';

interface DisclaimerPanelProps {
  children: React.ReactNode;
  className?: string;
}

const DisclaimerPanel: React.FC<DisclaimerPanelProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-md border border-gray-300 bg-gray-50 p-5 md:p-6 text-sm text-gray-600 leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
};

export default DisclaimerPanel;
