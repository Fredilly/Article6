// File path: components/ThreeComponents/VehiclesComponent/Plane.tsx

import React, { useRef, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, Vector3, Euler } from 'three';

const Satellite = () => {
  const planeModel = useLoader(GLTFLoader, '/assets/vehicles/planes/scene.glb');
  const planeRef = useRef<Mesh>(null);

  const globeRadius = 1.5; // Radius of the globe
  const planeAltitude = 0.1; // Constant altitude above the globe's surface

  useEffect(() => {
    if (planeModel.scene) {
      planeModel.scene.scale.set(0.0005, 0.0005, 0.0005); // Scale down the plane model
    }
  }, [planeModel]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = t % (2 * Math.PI); // Full circle in radians

    const x = (globeRadius + planeAltitude) * Math.sin(angle);
    const z = (globeRadius + planeAltitude) * Math.cos(angle);
    const y = 0; // Maintains a constant altitude

    if (planeRef.current) {
      planeRef.current.position.set(x, y, z);

      // Calculate the forward direction for the plane
      const forward = new Vector3(Math.cos(angle), 0, -Math.sin(angle));
      planeRef.current.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), forward);

      // Additional rotation to keep it parallel to the Earth's surface
      const parallelRotation = new Euler(-Math.PI / 2, 0, 0);
      planeRef.current.rotateOnAxis(new Vector3(1, 0, 0), parallelRotation.x);
    }
  });

  return <primitive ref={planeRef} object={planeModel.scene} />;
};

export default Satellite;
