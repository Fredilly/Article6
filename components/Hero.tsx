import React from 'react';
import Typewriter from 'typewriter-effect';

const Hero: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="backdrop-blur-lg bg-white/50 p-8 md:p-12 rounded-xl text-center shadow-lg">
        <h1 className="font-mono text-3xl md:text-4xl text-gray-800 min-h-[2.5rem]">
          <Typewriter
            options={{
              strings: [
                'Article6 Revives Forests',
                'Article6 Powers Precision Farming',
                'Article6 Reduces Carbon'
              ],
              autoStart: true,
              loop: true,
              pauseFor: 2000
            }}
          />
        </h1>
        <p className="mt-4 text-gray-700">
          Advancing climate solutions through certified carbon credits
        </p>
        <button className="mt-6 px-6 py-3 rounded-full border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-colors">
          Join Our Mission
        </button>
      </div>
    </div>
  );
};

export default Hero;
