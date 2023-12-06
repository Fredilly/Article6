// components/Technology/TechnologyColumns.tsx
import React, { useState } from 'react';
import CardFrontContent from './CardFrontContent';
import CardBackContent from './CardBackContent';

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

  return (
    <div className="flex flex-col md:flex-row justify-center items-start gap-8">
      {columns.map((column, index) => (
        <div key={index} className="card cursor-pointer" style={{ width: '300px', height: '400px', perspective: '1000px' }} onClick={() => handleCardClick(index)}>
          <div className={`cardInner ${flipped[index] ? 'flipped' : ''} max-w-sm text-center bg-white shadow-md rounded-lg transition-all duration-300 hover:shadow-xl`}>
            {/* Front Side */}
            <div className="cardFront absolute inset-0">
              <CardFrontContent title={column.title} imageUrl={column.imageUrl} description={column.description} link={column.link} />
            </div>
            {/* Back Side */}
            <div className="cardBack absolute inset-0">
              <CardBackContent />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TechnologyColumns;
