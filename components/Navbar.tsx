import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { navigationLinks } from '../utils/navigation';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const renderLinks = (mobile = false) => (
    navigationLinks.map(link => (
      <Link key={link.href} href={link.href} legacyBehavior>
        <a 
          className={`hover:text-green-600 transition-colors duration-300 ease-in-out ${mobile ? 'border-b border-white py-8 text-2xl text-left px-8 w-full' : ''}`}
          onClick={mobile ? toggleMobileMenu : undefined}
        >
          {link.label}
        </a>
      </Link>
    ))
  );

  return (
    <nav className="bg-white text-gray-700 shadow-md p-4 w-full">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/" legacyBehavior>
          <a className="flex items-center">
            <Image
              src="https://ik.imagekit.io/tzublgy5d/Article6/logo.png?"
              alt="Article6"
              width={40}
              height={40}
            />
          </a>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-12">
          {renderLinks()}
        </div>

        {/* Mobile Navigation - Hamburger Icon */}
        <div className="md:hidden">
          <button onClick={toggleMobileMenu}>
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation - Menu Overlay */}
      <div 
        className={`md:hidden bg-green-100 w-full h-full absolute top-0 left-0 flex flex-col justify-start pt-20 z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <button onClick={toggleMobileMenu} className="absolute top-4 right-4">
          <XMarkIcon className="h-6 w-6" />
        </button>
        {renderLinks(true)}
      </div>
    </nav>
  );
};

export default Navbar;
