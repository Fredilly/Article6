// components/Technology/CardFrontContent.tsx
import React from 'react';
import Image from 'next/image';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface CardFrontContentProps {
  title: string;
  imageUrl: string;
  description: string;
  link: string;
}

const CardFrontContent: React.FC<CardFrontContentProps> = ({ title, imageUrl, description, link }) => {
  return (
    <>
      <div className="h-52 relative w-full overflow-hidden rounded-t-lg">
        <Image src={imageUrl} alt={title} layout="fill" objectFit="cover" className="object-center" />
      </div>
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-2 text-green-600 hover:text-green-700">{title}</h2>
        <p className="mb-4 text-gray-600">{description}</p>
        <a href={link} className="group text-green-600 border border-green-600 hover:bg-green-600 hover:text-white rounded-full px-4 py-2 transition-colors duration-300 flex items-center justify-center gap-2" download>
            <ArrowDownTrayIcon className="h-5 w-5 text-green-600 group-hover:text-white" />
            Download PDF
        </a>
      </div>
    </>
  );
};

export default CardFrontContent;
