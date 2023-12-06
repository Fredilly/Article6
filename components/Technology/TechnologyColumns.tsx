// components/Technology/TechnologyColumns.tsx
import React, { useState } from 'react';
import Image from 'next/image';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface Column {
  title: string;
  imageUrl: string;
  description: string;
  link: string;
}

interface TechnologyColumnsProps {
  columns: Column[];
}

const TechnologyColumns: React.FC<TechnologyColumnsProps> = ({ columns }) => {
  const [flipped, setFlipped] = useState<boolean[]>(new Array(columns.length).fill(false));

  const handleCardClick = (index: number) => {
    setFlipped(flipped.map((f, i) => i === index ? !f : f));
  };

  const handleDownloadClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    event.stopPropagation();
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-start gap-8">
      {columns.map((column, index) => (
        <div key={index} className="card cursor-pointer" style={{ width: '300px', height: '400px', perspective: '1000px' }} onClick={() => handleCardClick(index)}>
          <div className={`cardInner ${flipped[index] ? 'flipped' : ''} max-w-sm text-center bg-white shadow-md rounded-lg transition-all duration-300 hover:shadow-xl`}>
            {/* Front Side */}
            <div className="cardFront absolute inset-0">
              <div className="h-52 relative w-full overflow-hidden rounded-t-lg">
                <Image src={column.imageUrl} alt={column.title} layout="fill" objectFit="cover" className="object-center" />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-green-600 hover:text-green-700">{column.title}</h2>
                <p className="mb-4 text-gray-600">
                  {column.description}
                </p>
                <a href={column.link} onClick={handleDownloadClick} className="group inline-block text-green-600 border border-green-600 hover:bg-green-600 hover:text-white rounded-full px-4 py-2 transition-colors duration-300 flex items-center justify-center gap-2" download>
                  <ArrowDownTrayIcon className="h-5 w-5 text-green-600 group-hover:text-white" />
                  Download PDF
                </a>
              </div>
            </div>
            {/* Back Side */}
            <div className="cardBack absolute inset-0">
              {/* Back side content */}
              {/* Add your content for the back of the card here */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TechnologyColumns;
