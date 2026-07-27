import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { previewNavigationLinks, previewCtaLink } from './navigation';

const BASE = '/preview/verification-readiness';

const PreviewHeader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3 md:py-4">
        <Link
          href={BASE}
          className="text-lg font-bold tracking-wide text-forest-900"
        >
          ARTICLE6
        </Link>

        <ul className="hidden md:flex items-center gap-8">
          {previewNavigationLinks.map(({ href, label }) => {
            const isActive = router.asPath === href || router.asPath.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? 'text-forest-700'
                      : 'text-gray-600 hover:text-forest-700'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <Link
              href={previewCtaLink.href}
              className="inline-flex items-center rounded-md bg-forest-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-forest-800"
            >
              {previewCtaLink.label}
            </Link>
          </li>
        </ul>

        <button
          className="md:hidden p-1 text-gray-700"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="preview-mobile-menu"
        >
          {open ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </nav>

      {open && (
        <div id="preview-mobile-menu" className="md:hidden border-t border-gray-200 bg-white">
          <ul className="flex flex-col px-4 py-3 gap-2">
            {previewNavigationLinks.map(({ href, label }) => {
              const isActive = router.asPath === href || router.asPath.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`block py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-forest-700 bg-forest-50'
                        : 'text-gray-600 hover:text-forest-700 hover:bg-forest-50'
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href={previewCtaLink.href}
                className="block py-2.5 px-3 rounded-md text-sm font-semibold text-white bg-forest-700 text-center hover:bg-forest-800 transition"
                onClick={() => setOpen(false)}
              >
                {previewCtaLink.label}
              </Link>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default PreviewHeader;
