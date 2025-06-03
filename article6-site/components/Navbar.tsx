'use client';
import Link from 'next/link';
import { Disclosure } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const nav = [
  { name: 'Projects', href: '/projects' },
  { name: 'About Us', href: '/about' },
  { name: 'Contact', href: '/contact' },
];

export default function Navbar() {
  return (
    <Disclosure as="nav" className="fixed top-0 w-full bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <Link href="/" className="flex items-center text-lg font-semibold">
                  <span className="hidden sm:block">
                    Article<span className="text-brand-dark">6</span>
                  </span>
                  <span className="sm:hidden">
                    A<span className="text-brand-dark">6</span>
                  </span>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {nav.map((item) => (
                  <Link key={item.name} href={item.href} className="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-brand-dark">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-900 hover:text-brand-dark">
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>
          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 px-2 pt-2 pb-3">
              {nav.map((item) => (
                <Link key={item.name} href={item.href} className="block px-3 py-2 text-base font-medium text-gray-900 hover:text-brand-dark">
                  {item.name}
                </Link>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
