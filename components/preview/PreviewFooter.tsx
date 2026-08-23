import React from 'react';
import Link from 'next/link';
import { getPreviewNavigationLinks } from './navigation';
import { useRouter } from 'next/router';
import Logo from '../Logo';

const PREVIEW_BASE = '/preview/verification-readiness';

const PreviewFooter: React.FC = () => {
  const router = useRouter();
  const isPreview = router.pathname.startsWith(PREVIEW_BASE);
  const navigationLinks = getPreviewNavigationLinks(isPreview);
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <Logo href={isPreview ? PREVIEW_BASE : '/'} />
        <p className="mt-2 text-sm text-gray-500">
          Evidence readiness assessments for carbon projects.
        </p>
        <p className="mt-1 text-xs text-gray-400 leading-relaxed max-w-md">
          Independent pre-validation review. Not affiliated with Verra or any validation and
          verification body.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1">
          {navigationLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="preview-focus-ring rounded-sm text-xs text-gray-500 transition-colors hover:text-forest-700"
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
