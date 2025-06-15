import React from 'react';
import Typewriter from 'typewriter-effect';
import 'tailwindcss/tailwind.css';

const TypewriterText = () => {
  return (
    <div className="flex flex-col md:grid md:grid-cols-2 items-center md:items-start justify-start min-h-screen pt-10 md:pt-20">
      <span className="text-gray-700 text-4xl justify-self-end mr-2">Shaping</span>
      <div className="text-green-600 text-4xl justify-self-start">
        <Typewriter
          onInit={(typewriter) => {
            typewriter
              .pauseFor(1000)
              .start();
          }}
          options={{
            strings: ['Environment', 'Future', 'Policy'],
            autoStart: true,
            loop: true
          }}
        />
      </div>
    </div>
  );
};

export default TypewriterText;
