import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import GlobeComponent from './ThreeComponents/GlobeComponent/GlobeComponent';

const GlobeSection: React.FC = () => (
  <div className="w-full h-screen">
    <ErrorBoundary>
      <GlobeComponent />
    </ErrorBoundary>
  </div>
);

export default GlobeSection;
