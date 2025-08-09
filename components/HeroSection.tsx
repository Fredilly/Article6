import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {isClient ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="https://ik.imagekit.io/tzublgy5d/Article6/hero480.mp4?updatedAt=1754588076486"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-black" />
      )}
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white text-5xl md:text-6xl font-semibold tracking-tight drop-shadow-xl">
          Pioneering <span className="text-green-500">Carbon Solutions</span>
        </h1>
        <p className="mt-6 text-white/90 text-lg md:text-xl font-medium tracking-wide">
          Technology for a sustainable future
        </p>
        <Link
          href="/contact"
          className="mt-10 inline-block rounded-md bg-white px-6 py-3 text-base font-semibold text-green-500 shadow-lg transition hover:bg-green-50"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
};

export default HeroSection;
