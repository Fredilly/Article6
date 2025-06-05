// pages/technology/index.tsx
import React from 'react';
import Image from 'next/image';
import TechnologyColumns from '../../components/Technology/TechnologyColumns';

const TechnologyPage = () => {
  // Data for the three columns
  const columns = [
    {
      title: "Admin System",
      imageUrl: "https://ik.imagekit.io/ufokswd8x/Articlesix/technology/Advanced%20Management.png?updatedAt=1701350114385",
      description: "Description for Advanced Admin System...",
      link: "https://ik.imagekit.io/ufokswd8x/Articlesix/technology/Green%20Sys%20Strategy.pdf?updatedAt=1702251009854"
    },
    {
      title: "Weather Forecast",
      imageUrl: "https://ik.imagekit.io/ufokswd8x/Articlesix/technology/Weather%20forecast.png?updatedAt=1701350113262",
      description: "Insightful details about the Weather Forecast feature...",
      link: "/weather-forecast-link"
    },
    {
      title: "Transparency",
      imageUrl: "https://ik.imagekit.io/ufokswd8x/Articlesix/technology/Transparency.png?updatedAt=1701350111212",
      description: "Overview of our Transparency initiative...",
      link: "/transparency-link"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-6 max-w-4xl"> {/* Adjust max-width as needed */}
      {/* Existing Content and Image */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-16">
        <div className="md:w-1/2 px-4">
          <div className="text-left max-w-md mx-auto md:mx-0 md:ml-auto">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 text-green-600 hover:text-green-700 transition-colors duration-300">
              Technology
            </h1>
            <p className="text-base lg:text-lg">
              At Articlesix, technology is fundamental. We focus on harnessing open-source innovations
              to address long-standing environmental issues. Our approach is pragmatic and
              collaborative, tapping into the latest in analytics and AI to offer real-world solutions
              to climate change and resource management. We believe in the power of open tech to drive
              meaningful change.
            </p>
          </div>
        </div>
        <div className="md:w-1/2 max-w-md md:max-w-xl h-64 md:h-auto bg-gray-200 rounded-md overflow-hidden md:mr-auto">
          <Image
            src="https://ik.imagekit.io/ufokswd8x/Articlesix/technology/technology_hero.png?updatedAt=1701060098042"
            alt="Innovative technology solutions at Articlesix"
            layout="responsive"
            width={700}
            height={400}
          />
        </div>
      </div>

      {/* Columns Section */}
      <TechnologyColumns columns={columns} />
    </div>
  );
};

export default TechnologyPage;
