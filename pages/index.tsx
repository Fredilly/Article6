import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const HeroSection = dynamic(() => import('../components/HeroSection'), {
  ssr: false,
  suspense: true,
});

const StaticHero = () => (
  <div className="relative w-full h-screen overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-center text-white text-4xl md:text-5xl font-semibold tracking-tight drop-shadow-xl">
        Africa’s carbon potential, unlocked.
      </h1>
      <p className="mt-6 text-white/90 text-base md:text-lg font-medium tracking-wide drop-shadow-xl">
        Technology for a sustainable future
      </p>
      <Link
        href="/contact"
        className="mt-8 px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 drop-shadow-xl"
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
