// pages/about/index.tsx
import React from 'react';

const AboutUsPage = () => {
  return (
    <div className="container mx-auto py-16 px-6 max-w-4xl"> {/* Consistent margins and width */}
      {/* Header Section */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-extrabold mb-6 text-green-700">
          About Us
        </h1>
        <p className="text-lg text-gray-700">
          At ArticleSix, we are committed to harnessing the power of technology and innovation to drive sustainability and environmental conservation. Our mission is to create a better future by developing and implementing solutions that make a real-world impact.
        </p>
      </div>

      {/* Mission Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700">Our Mission</h2>
        <p className="text-lg text-gray-700">
          Our mission is to empower communities and industries to adopt sustainable practices. We focus on projects that address climate change, promote renewable energy, and support responsible resource management. Through our collaborative approach, we aim to make a lasting difference in the world.
        </p>
      </div>

      {/* Values Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700">Our Values</h2>
        <ul className="list-disc list-inside text-lg text-gray-700">
          <li>Innovation: We believe in the power of creativity and new ideas to solve global challenges.</li>
          <li>Sustainability: Our work is guided by the principles of environmental stewardship and long-term impact.</li>
          <li>Collaboration: We value partnerships and teamwork as essential components of success.</li>
          <li>Integrity: We are committed to transparency, accountability, and ethical practices in all that we do.</li>
        </ul>
      </div>

      {/* Team Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700">Meet Our Team</h2>
        <p className="text-lg text-gray-700">
          Our team is composed of experts from diverse backgrounds, including environmental science, technology, and project management. We are passionate about driving change and are dedicated to advancing the principles of sustainable development.
        </p>
      </div>

      {/* Vision Section */}
      <div className="mb-16">
        <h2 className="text-4xl font-semibold mb-4 text-green-700">Our Vision</h2>
        <p className="text-lg text-gray-700">
          Our vision is a world where sustainable practices are the norm, and where technology plays a key role in addressing environmental challenges. We strive to be at the forefront of this movement, leading by example and inspiring others to join us on this journey.
        </p>
      </div>
    </div>
  );
};

export default AboutUsPage;
