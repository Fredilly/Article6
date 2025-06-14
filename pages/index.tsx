import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobeComponent from '../components/ThreeComponents/GlobeComponent/GlobeComponent';
import HeroText from '../components/HeroText';
import '../styles/globals.css';

const HomePage = () => {
  return (
    <div className="relative w-full h-screen">
      <ErrorBoundary>
        <GlobeComponent />
      </ErrorBoundary>
      <HeroText />
    </div>
  );
};

export default HomePage;
