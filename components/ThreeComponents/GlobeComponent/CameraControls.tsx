import React from 'react';
import { OrbitControls } from '@react-three/drei';

const CameraControls = () => {
  return (
    <OrbitControls
      enableZoom={false}
      enablePan={false}
      minPolarAngle={Math.PI / 2} // Limit vertical rotation
      maxPolarAngle={Math.PI / 2}
    />
  );
};

export default CameraControls;
