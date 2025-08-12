import React from 'react';
import HeroSection from '../components/HeroSection';
import '../styles/globals.css';

const HomePage = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <main className="max-w-6xl mx-auto p-6 space-y-6"></main>
    </div>
  );
};

export default HomePage;
