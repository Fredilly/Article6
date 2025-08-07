import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://ik.imagekit.io/tzublgy5d/Article6/hero360.mp4?updatedAt=1754587990038"
        autoPlay
        loop
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-white text-5xl md:text-7xl font-light tracking-tight drop-shadow-lg">
          Pioneering <span className="text-green-500 font-medium">Carbon Solutions</span>
        </h1>
        <p className="mt-6 text-white/80 text-lg md:text-xl">
          Technology for a sustainable future
        </p>
      </div>
    </div>
  );
};

export default HeroSection;

