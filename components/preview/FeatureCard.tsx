import React from 'react';

interface FeatureCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, children, className = '' }) => {
  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white p-6 md:p-8 shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      <h3 className="text-lg md:text-xl font-semibold text-forest-900">{title}</h3>
      <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
};

export default FeatureCard;
