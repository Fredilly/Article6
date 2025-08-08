import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { navigationLinks } from '../utils/navigation';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.classList.remove('mobile-menu-open');
    };
  }, [isMobileMenuOpen]);

  const renderLinks = (mobile = false) =>
    navigationLinks.map(link => (
      <Link key={link.href} href={link.href} legacyBehavior>
        <a
          className={`nav-link hover:text-green-400 transition-colors duration-300 ease-in-out ${mobile ? 'py-4 text-2xl text-center w-full' : ''}`}
          onClick={mobile ? toggleMobileMenu : undefined}
        >
          {link.label}
        </a>
      </Link>
    ));

  return (
    <nav className="flex items-center justify-between min-h-14 px-4 w-full bg-transparent text-white drop-shadow-md">
      {/* Logo and Text */}
      <Link href="/" legacyBehavior>
        <a className="flex items-center font-bold h-8 w-32 overflow-hidden flex-shrink-0">
          Article<span className="text-green-600">6</span>
        </a>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex space-x-6">
        {renderLinks()}
      </div>

      {/* Mobile Navigation - Hamburger Icon */}
      <button
        className="md:hidden p-2 mr-2"
        onClick={toggleMobileMenu}
        aria-label="Open Menu"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Navigation - Menu Overlay */}
      <div
        className={`fixed inset-0 bg-white/95 text-gray-900 flex flex-col items-center justify-center z-50 transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <button
          onClick={toggleMobileMenu}
          className="absolute top-4 right-4 p-2"
          aria-label="Close Menu"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        {renderLinks(true)}
      </div>
    </nav>
  );
};

export default Navbar;
