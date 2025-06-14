import React from 'react';
import Typewriter from 'typewriter-effect';
import 'tailwindcss/tailwind.css';

const TypewriterText = () => {
  return (
    <div className="flex items-center justify-center space-x-2 pt-4 text-4xl">
      <span className="text-gray-700">Shaping</span>
      <div className="text-green-600">
        <Typewriter
          options={{
            strings: ['Environment', 'Future', 'Policy'],
            autoStart: true,
            loop: true,
          }}
        />
      </div>
    </div>
  );
};

export default TypewriterText;
