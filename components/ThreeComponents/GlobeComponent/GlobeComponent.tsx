// GlobeComponent.tsx
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import EarthSphere from './EarthSphere';
import Atmosphere from './Atmosphere';
import CameraControls from './CameraControls';
import Plane from '../VehiclesComponent/planes';
import TreeComponent from '../TreeComponent/TreeComponent';

const GlobeComponent: React.FC = () => {
  const globeRadius = 1.5; // Your globe's radius
  const treePosition: [number, number, number] = [0, globeRadius + 0.5, 0]; // Adjust for visibility

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
