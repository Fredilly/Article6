import React from 'react';

interface PrincipleCardProps {
  title: string;
  children: React.ReactNode;
}

const PrincipleCard: React.FC<PrincipleCardProps> = ({ title, children }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 md:p-7">
      <h3 className="text-base md:text-lg font-semibold text-forest-800">{title}</h3>
      <p className="mt-2 text-sm md:text-base text-gray-600 leading-relaxed">{children}</p>
    </div>
  );
};

export default PrincipleCard;
