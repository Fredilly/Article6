import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import EarthSphere from './EarthSphere';
import Atmosphere from './Atmosphere';
import CameraControls from './CameraControls';
import Plane from '../VehiclesComponent/planes'; // Updated import path

const GlobeComponent = () => {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[0, 10, 5]} intensity={4} castShadow />
          <EarthSphere />
          <Atmosphere />
          <CameraControls />
          <Plane />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default GlobeComponent;
