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
    const newFlipped = flipped.map((f, i) => i === index ? !f : f);
    setFlipped(newFlipped);
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-8">
      {columns.map((column, index) => (
        <div
          key={index}
          className="card cursor-pointer w-full sm:w-[300px] h-[400px]"
          onClick={() => handleCardClick(index)}
        >
          <div
            className={`cardInner ${flipped[index] ? 'flipped' : ''} w-full h-full text-center bg-white shadow-md rounded-lg transition-all duration-300 hover:shadow-xl`}
          >
            {/* Front Side */}
            <div className="cardFront absolute inset-0">
              <div className="h-52 relative w-full overflow-hidden rounded-t-lg">
                <Image src={column.imageUrl} alt={column.title} layout="fill" objectFit="cover" className="object-center" />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold mb-2 text-green-600 hover:text-green-700">{column.title}</h2>
                <p className="mb-4 text-gray-600">{column.description}</p>
                <a href={column.link} onClick={(e) => e.stopPropagation()} className="group text-green-600 border border-green-600 hover:bg-green-600 hover:text-white rounded-full px-4 py-2 transition-colors duration-300 flex items-center justify-center gap-2" download>
                  <ArrowDownTrayIcon className="h-5 w-5 text-green-600 group-hover:text-white" />
                  Download PDF
                </a>
              </div>
            </div>
            {/* Back Side */}
            <div className="cardBack absolute inset-0 bg-white">
              <div className="p-4">
                {/* Add content for the back of the card here */}
                <h3 className="text-lg font-semibold">Back Card Content</h3>
                <p>Details about the collaboration, simulation, or any other relevant information.</p>
                {/* Place additional elements or interactive components here */}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TechnologyColumns;
