import React from 'react';
import Typewriter from 'typewriter-effect';

const Hero: React.FC = () => {
  return (
    <section className="w-full h-screen flex items-center justify-center bg-gradient-to-b from-white to-green-50">
      <div className="bg-white bg-opacity-80 rounded-lg shadow-lg p-8 text-center max-w-xl">
        <h1 className="font-mono text-3xl md:text-4xl text-gray-800 mb-4 h-12">
          <Typewriter
            options={{
              strings: ['Forest Restoration', 'Precision Farming', 'Carbon Reduction'],
              autoStart: true,
              loop: true,
              pauseFor: 2000,
            } as any}
          />
        </h1>
        <p className="text-gray-700 text-lg md:text-xl mb-6">
          Advancing climate solutions through certified carbon credits
        </p>
        <button className="border border-green-600 text-green-600 px-6 py-2 rounded hover:bg-green-600 hover:text-white transition-colors">
          Join Our Mission
        </button>
      </div>
    </section>
  );
};

export default Hero;
