import React from 'react';

interface SectionHeadingProps {
  heading: string;
  body?: string;
  align?: 'left' | 'center';
  className?: string;
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  heading,
  body,
  align = 'center',
  className = '',
}) => {
  return (
    <div className={`${align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-forest-900">
        {heading}
      </h2>
      {body && (
        <p className="mt-4 max-w-3xl mx-auto text-base md:text-lg text-gray-600 leading-relaxed">
          {body}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
