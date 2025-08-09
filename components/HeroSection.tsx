import React from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/tzublgy5d/Article6/hero480.mp4?updatedAt=1754588076486"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'%3E%3Crect width='1280' height='720' fill='%231a202c'/%3E%3C/svg%3E"
        autoPlay
        loop
        muted
        playsInline
        preload="none"
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight drop-shadow-xl">
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
};

export default HeroSection;

