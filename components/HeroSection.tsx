import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const HeroSection: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setContentVisible(true);
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
        <div
          className={`transform transition-all duration-700 ease-out ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-white text-5xl md:text-6xl font-semibold tracking-tight drop-shadow-xl">
            The carbon stack for countries
          </h1>
          <p className="mt-6 text-white text-lg md:text-xl font-medium tracking-wide">
            We measure, we report, we verify
          </p>
          <Link
            href="/contact"
            className="mt-10 inline-block rounded-md bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm border border-white/20 shadow-lg transition hover:bg-white/20"
          >
            Book an expert
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
