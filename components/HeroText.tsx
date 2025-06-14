import React from 'react';
import Typewriter from 'typewriter-effect';

const HeroText: React.FC = () => {
  return (
    <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 text-center z-10">
      <h1 className="text-4xl md:text-6xl font-bold text-white">
        Article6 is{' '}
        <span className="text-green-400">
          <Typewriter
            options={{
              strings: ['sustainable', 'innovative', 'profitable'],
              autoStart: true,
              loop: true,
            }}
          />
        </span>
      </h1>
    </div>
  );
};

export default HeroText;
