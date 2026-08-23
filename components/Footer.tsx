// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="mx-auto max-w-6xl flex flex-col items-start justify-between gap-2 px-4 py-6 sm:flex-row sm:items-center">
        <p className="text-sm text-gray-700">
          &copy; {new Date().getFullYear()} Article<span className="text-forest-700">6</span>. All
          rights reserved.
        </p>
        <p className="text-xs text-gray-400">
          Independent pre-validation evidence readiness assessments.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
