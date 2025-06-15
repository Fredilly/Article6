import React from 'react';
import Typewriter from 'typewriter-effect';

const Hero: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="backdrop-blur-lg bg-white/50 p-8 md:p-12 rounded-xl text-center shadow-lg">
        <h1 className="font-mono text-3xl md:text-4xl text-gray-800 min-h-[2.5rem]">
          <span>Article6 </span>
          <span className="inline-block">
            <Typewriter
              onInit={(typewriter) => {
                typewriter
                  .pauseFor(500)
                  .typeString('Revives Forests')
                  .pauseFor(2000)
                  .deleteAll()
                  .typeString('Powers Precision Farming')
                  .pauseFor(2000)
                  .deleteAll()
                  .typeString('Reduces Carbon')
                  .pauseFor(2000)
                  .deleteAll()
                  .start();
              }}
              options={{
                autoStart: true,
                loop: true,
              }}
            />
          </span>
        </h1>
        <p className="mt-4 text-gray-700">
          Advancing climate solutions through certified carbon credits
        </p>
        <button className="mt-6 px-6 py-3 rounded-full text-green-600 hover:bg-green-600 hover:text-white transition-colors">
          Join Our Mission
        </button>
      </div>
    </div>
  );
};

export default Hero;
