import React from 'react';
import Link from 'next/link';
import { previewNavigationLinks, previewCtaLink } from './navigation';

const PreviewFooter: React.FC = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Link href="/preview/verification-readiness" className="text-lg font-bold tracking-wide text-forest-900">
              ARTICLE6
            </Link>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed max-w-xs">
              Evidence readiness assessments for carbon projects.
            </p>
            <p className="mt-3 text-xs text-gray-400 leading-relaxed max-w-xs">
              Independent pre-validation review. Article6 is not affiliated with Verra or any
              validation and verification body.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Pages</h4>
            <ul className="mt-4 space-y-2.5">
              {previewNavigationLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-gray-600 hover:text-forest-700 transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Contact</h4>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href={previewCtaLink.href}
                  className="text-sm text-gray-600 hover:text-forest-700 transition-colors"
                >
                  {previewCtaLink.label}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Article6. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default PreviewFooter;
