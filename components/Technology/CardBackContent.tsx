// components/Technology/CardBackContent.tsx
import React from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface CardBackContentProps {
  // Define additional properties if needed
}

const CardBackContent: React.FC<CardBackContentProps> = (props) => {
  return (
    <div className="p-4 flex flex-col items-center justify-center h-full">
      {/* Other back card content here */}
      
      {/* Explore Button */}
      <div className="mt-auto"> {/* Adjust this to position the button correctly */}
        <button className="group bg-purple-600 text-white border border-purple-600 hover:bg-purple-700 hover:border-purple-700 rounded-full px-4 py-2 transition-colors duration-300 flex items-center justify-center gap-2">
          <SparklesIcon className="h-5 w-5 group-hover:text-white" />
          Explore
        </button>
      </div>
    </div>
  );
};

export default CardBackContent;
