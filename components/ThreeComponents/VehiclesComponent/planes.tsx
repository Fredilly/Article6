import React, { useRef, useEffect } from 'react';
import { Canvas, useLoader, useFrame, extend } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, Vector3, Matrix4 } from 'three';

const Plane = () => {
  const planeModel = useLoader(GLTFLoader, '/assets/vehicles/planes/hot_air_balloon.glb');
  const planeRef = useRef<Mesh>(null);

  const globeRadius = 1.5; // Radius of the globe
  const planeAltitude = 0.3; // Increased altitude above the globe's surface

  useEffect(() => {
    if (planeModel.scene) {
      planeModel.scene.scale.set(0.005, 0.005, 0.005); // Scale down the plane model
      planeModel.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true; // Enable shadow casting for meshes
        }
      });
    }
  }, [planeModel]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = (t / 4) % (2 * Math.PI); // Slower rotation

    const x = (globeRadius + planeAltitude) * Math.sin(angle);
    const z = (globeRadius + planeAltitude) * Math.cos(angle);
    const y = 0; // Maintains a constant altitude

    if (planeRef.current) {
      planeRef.current.position.set(x, y, z);

      const tangent = new Vector3(Math.cos(angle), 0, -Math.sin(angle));
      const up = new Vector3(0, 1, 0);
      const side = new Vector3().crossVectors(up, tangent).normalize();

      const matrix = new Matrix4();
      matrix.makeBasis(side, up, tangent);
      planeRef.current.quaternion.setFromRotationMatrix(matrix);
    }
  });

  return <primitive ref={planeRef} object={planeModel.scene} />;
};

const Scene = () => {
  return (
    <Canvas shadows>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow // Enable shadow casting
      />
      <Plane />
      {/* Other components of your scene */}
    </Canvas>
  );
};

export default Plane;