import React, { useState, useEffect } from 'react';
import { BackSide } from 'three';

const Atmosphere = () => {
  const [scale, setScale] = useState<[number, number, number]>([1.1, 1.1, 1.1]);

  useEffect(() => {
    const updateScale = () => {
      const screenWidth = window.innerWidth;
      if (screenWidth <= 768) {
        setScale([1.02, 1.02, 1.02]); // Reduced atmosphere for mobile devices
      } else {
        setScale([1.1, 1.1, 1.1]); // Default scale for larger screens
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <mesh scale={scale} position={[0, 0, 0]}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <meshBasicMaterial color="lightblue" transparent opacity={0.2} side={BackSide} />
    </mesh>
  );
};

export default Atmosphere;
