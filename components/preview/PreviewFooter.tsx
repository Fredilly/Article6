import React from 'react';
import Link from 'next/link';
import { previewNavigationLinks } from './navigation';
import Logo from '../Logo';

const BASE = '/preview/verification-readiness';

const PreviewFooter: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <Logo href={BASE} />
        <p className="mt-2 text-sm text-gray-500">
          Evidence readiness assessments for carbon projects.
        </p>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed max-w-md">
          Independent pre-validation review. Not affiliated with Verra or any validation and
          verification body.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
          {previewNavigationLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-xs text-gray-400 hover:text-forest-700 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="mt-6 pt-5 border-t border-gray-100 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Article6. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default PreviewFooter;
