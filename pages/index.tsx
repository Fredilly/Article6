import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobeComponent from '../components/ThreeComponents/GlobeComponent/GlobeComponent';
import HeroSection from '../components/HeroSection';
import '../styles/globals.css';

const HomePage = () => {
  return (
    <div className="w-full">
      <HeroSection />
      <div className="w-full h-screen">
        <ErrorBoundary>
          <GlobeComponent />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default HomePage;
