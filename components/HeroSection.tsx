import React from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-900">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="/hero-video.mp4"
        poster="/hero-poster.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="none"
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white text-6xl md:text-7xl font-extrabold tracking-tight leading-tight drop-shadow-lg">
          Africa’s carbon potential, unlocked.
        </h1>
        <p className="mt-4 text-white text-xl md:text-2xl font-medium drop-shadow-lg">
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
};

export default HeroSection;

