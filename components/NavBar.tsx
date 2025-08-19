import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { navigationLinks } from '../utils/navigation';

const NavBar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Close the mobile menu when resizing to desktop widths
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
    <header className="bg-white shadow-md fixed w-full z-50">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center text-lg font-bold">
          Article<span className="text-green-600">6</span>
        </Link>

        <ul className="hidden md:flex gap-12">
          {navigationLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`hover:text-green-600 transition-colors duration-300 ${router.asPath.startsWith(href) ? 'text-green-600' : ''}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <Bars3Icon className={`${open ? 'hidden' : 'block'} h-6 w-6`} />
          <XMarkIcon className={`${open ? 'block' : 'hidden'} h-6 w-6`} />
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="md:hidden bg-white border-t shadow-md">
          <ul className="flex flex-col p-4 gap-4">
            {navigationLinks.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block py-2 px-4 hover:text-green-600 transition-colors ${router.asPath.startsWith(href) ? 'text-green-600' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default NavBar;
