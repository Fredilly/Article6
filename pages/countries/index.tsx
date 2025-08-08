// pages/countries/index.tsx
import React from 'react';
import Image from 'next/image';

const CountriesPage = () => {
  return (
    <div className="container mx-auto py-16 px-6 max-w-6xl"> {/* Adjust max-width as needed */}
      {/* Header Section */}
      <div className="text-center mb-20">
        <h1 className="text-6xl font-extrabold mb-6 text-green-700 transition-colors duration-300">
          Nigeria
        </h1>
        <div className="flex justify-center">
          <Image src={"https://ik.imagekit.io/ufokswd8x/" + "Article" + "six/Countries/Nigeria.png?updatedAt=1720782350360"} alt="Nigeria Image" width={600} height={400} className="rounded-lg" />
        </div>
      </div>

      {/* Grid Layout for Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Economy Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Economy</h2>
          <p className="text-lg text-gray-700">
            Overview of Nigeria&apos;s economy, highlighting major industries such as oil and gas, agriculture, and technology.
          </p>
        </div>

        {/* Environment and Sustainability Initiatives Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Environment and Sustainability Initiatives</h2>
          <p className="text-lg text-gray-700">
            Details about Article<span className="text-green-600">6</span>&apos;s collaboration with the Green Economy Partnership on sustainability projects in Nigeria.
            Information on forestry, peatlands for carbon capture, blue carbon, and agriculture initiatives.
          </p>
        </div>

        {/* Cultural Highlights Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Cultural Highlights</h2>
          <p className="text-lg text-gray-700">
            Information on Nigerian culture, including languages, festivals, traditional clothing, and cuisine.
          </p>
        </div>

        {/* Tourism Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Tourism</h2>
          <p className="text-lg text-gray-700">
            Key tourist attractions in Nigeria, such as national parks, historical sites, and major cities.
          </p>
        </div>

        {/* Current Projects Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Current Projects</h2>
          <p className="text-lg text-gray-700">
            Details about ongoing projects led by Article<span className="text-green-600">6</span> in Nigeria. Information on how these projects contribute to sustainability and economic growth.
          </p>
        </div>

        {/* Investment Opportunities Section */}
        <div className="bg-white p-8 shadow-sm rounded-lg transition-shadow hover:shadow-md">
          <h2 className="text-4xl font-semibold mb-4 text-green-700">Investment Opportunities</h2>
          <p className="text-lg text-gray-700">
            Potential investment opportunities in Nigeria, especially in the areas of green economy and sustainable development. 
            How investors can get involved and the benefits of investing in these projects.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountriesPage;
