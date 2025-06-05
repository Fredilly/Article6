import React from 'react';
import ErrorBoundary from '../components/ErrorBoundary';
import GlobeComponent from '../components/ThreeComponents/GlobeComponent/GlobeComponent';
import '../styles/globals.css';

const HomePage = () => {
  return (
    <div className="w-full h-screen ">
      <ErrorBoundary>
        <GlobeComponent />
      </ErrorBoundary>
    </div>
  );
};

export default HomePage;
