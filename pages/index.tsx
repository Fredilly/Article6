import React from 'react';

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold mb-4">Coming Soon</h1>
      <p className="text-lg">
        Contact us at{' '}
        <a href="mailto:contact@article6.org" className="text-blue-600 underline">
          contact@article6.org
        </a>
      </p>
    </div>
  );
};

export default HomePage;
