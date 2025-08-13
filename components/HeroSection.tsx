import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import RotatingPhrase from './RotatingPhrase';

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
        <h1
          className="text-white text-3xl md:text-5xl font-semibold tracking-tight leading-tight flex flex-wrap md:flex-nowrap items-baseline gap-x-2 text-balance"
        >
          <span className="opacity-90">The carbon stack for</span>
          <span className="basis-full md:basis-auto md:ml-2">
            <RotatingPhrase
              phrases={["governments", "treasuries", "climate teams"]}
              className="text-green-400"
              reducedMotionFallback="governments"
              responsiveWrap
            />
          </span>
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
