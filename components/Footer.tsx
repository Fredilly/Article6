// components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-200 text-center p-4 text-sm text-gray-700">
      <p>
        &copy; {new Date().getFullYear()} Article<span className="text-forest-700">6</span> All rights
        reserved.
      </p>
      {/* You can add more footer content here such as social links */}
    </footer>
  );
};

export default Footer;
