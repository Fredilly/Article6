import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/tzublgy5d/drone1.mp4?updatedAt=1754575398687"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white text-7xl md:text-9xl font-black tracking-tight drop-shadow-2xl">
          Pioneering <span className="text-green-500">Carbon Solutions</span>
        </h1>
        <p className="mt-8 text-white/90 text-xl md:text-2xl font-semibold tracking-wide">
          Technology for a sustainable future
        </p>
      </div>
    </div>
  );
};

export default HeroSection;

