import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const HeroSection = dynamic(() => import('../components/HeroSection'), {
  ssr: false,
  suspense: true,
});

const StaticHero = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div className="absolute inset-0 bg-gray-900 bg-[url('/hero-poster.jpg')] bg-cover bg-center" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-center text-6xl md:text-7xl font-extrabold tracking-tight leading-tight text-white drop-shadow-lg">
        Africa’s carbon potential, unlocked.
      </h1>
      <p className="mt-4 text-xl md:text-2xl font-medium text-white drop-shadow-lg">
        Technology for a sustainable future
      </p>
      <Link
        href="/contact"
        className="mt-8 px-8 py-3 bg-green-600 text-white text-lg md:text-xl font-bold rounded-lg hover:bg-green-700 drop-shadow-lg"
      >
        Book a call
      </Link>
    </div>
  </div>
);

const HomePage = () => {
  return (
    <div className="w-full">
      <Suspense fallback={<StaticHero />}>
        <HeroSection />
      </Suspense>
    </div>
  );
};

export default HomePage;
