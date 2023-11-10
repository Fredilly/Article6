import React, { useState } from 'react';
import Link from 'next/link';
import { Bars2Icon, XMarkIcon } from '@heroicons/react/24/outline'; // Import the XMarkIcon for the close button
import { navigationLinks } from '../utils/navigation';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const renderLinks = (mobile = false) => (
    navigationLinks.map(link => (
      <Link key={link.href} href={link.href} legacyBehavior>
        <a className={`hover:text-green-600 transition-colors duration-300 ease-in-out ${mobile ? 'border-b border-white py-8 text-2xl text-left px-8 w-full' : ''}`}>{link.label}</a>
      </Link>
    ))
  );

  return (
    <nav className="bg-white text-gray-700 shadow-md p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-lg font-bold">Articlesix</div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-12">
          {renderLinks()}
        </div>

        {/* Mobile Navigation - Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu}>
            <Bars2Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-green-100 w-full h-full absolute top-0 left-0 flex flex-col justify-start pt-20 z-50">
          <button onClick={toggleMobileMenu} className="absolute top-4 right-4">
            <XMarkIcon className="h-6 w-6" />
          </button>
          {renderLinks(true)} {/* Mobile-specific styles applied here */}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
