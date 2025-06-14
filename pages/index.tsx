import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobeComponent from '../components/ThreeComponents/GlobeComponent/GlobeComponent';
import TypewriterText from '../components/TypewriterText';
import '../styles/globals.css';

const HomePage = () => {
  return (
    <div className="relative w-full h-screen">
      <div className="absolute left-1/2 -translate-x-1/2 top-4">
        <TypewriterText />
      </div>
      <ErrorBoundary>
        <GlobeComponent />
      </ErrorBoundary>
    </div>
  );
};

export default HomePage;
