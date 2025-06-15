import React from 'react';
import Typewriter from 'typewriter-effect';
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <section className="relative flex items-center justify-center bg-white min-h-screen pt-16">
      <div className="relative mx-4 p-8 md:p-16 bg-white/60 backdrop-blur-lg rounded-xl shadow-lg text-center flex flex-col items-center">
        <h1 className="font-mono font-bold text-3xl sm:text-5xl text-gray-800 mb-4">
          <Typewriter
            options={{
              strings: ['Article6 Revives Forests', 'Article6 Powers Precision Farming', 'Article6 Reduces Carbon'],
              autoStart: true,
              loop: true,
              pauseFor: 2000,
            }}
          />
        </h1>
        <p className="text-gray-700 mb-6">
          Advancing climate solutions through certified carbon credits
        </p>
        <Link href="/contact" legacyBehavior>
          <a className="border-2 border-green-600 text-green-600 rounded-full px-6 py-2 hover:bg-green-600 hover:text-white transition-colors">
            Join Our Mission
          </a>
        </Link>
      </div>
    </section>
  );
};

export default Hero;
