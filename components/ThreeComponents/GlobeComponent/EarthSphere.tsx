// EarthSphere.tsx
import React, { useRef, useState, useEffect } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader, Mesh } from 'three';

const EarthSphere = () => {
  const earthTexture = useLoader(TextureLoader, '/assets/textures/earth_real.jpg');
  const bumpMap = useLoader(TextureLoader, '/assets/textures/earth_bump.jpg'); // Load bump map
  const maskTexture = useLoader(TextureLoader, '/assets/textures/mask.png');
  const [radius, setRadius] = useState(1.5);
  const meshRef = useRef<Mesh>(null);

  useEffect(() => {
    const updateRadius = () => {
      const screenWidth = window.innerWidth;
      setRadius(screenWidth > 768 ? 1.5 : 1.2);
    };

    updateRadius();
    window.addEventListener('resize', updateRadius);

    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} receiveShadow castShadow>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial 
        map={earthTexture} 
        metalness={0.4} 
        roughnessMap={maskTexture} 
        bumpMap={bumpMap} 
        bumpScale={0.05} // Adjust this value for desired bump intensity
      />
    </mesh>
  );
};

export default EarthSphere;
