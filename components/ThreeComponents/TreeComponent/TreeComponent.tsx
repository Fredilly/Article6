// TreeComponent.tsx
import React, { useRef, useEffect, useState } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh, Vector3 } from 'three';

interface TreeComponentProps {
  position: Vector3 | [number, number, number];
}

const TreeComponent: React.FC<TreeComponentProps> = ({ position }) => {
  const treeModel = useLoader(GLTFLoader, '/assets/trees/snow_pine.glb');
  const treeRef = useRef<Mesh>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (treeModel.scene) {
      treeModel.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true;
        }
      });
    }
    // Set an interval to toggle visibility
    const interval = setInterval(() => {
      setIsVisible(v => !v);
    }, 2000);

    return () => clearInterval(interval);
  }, [treeModel]);

  useFrame(() => {
    if (treeRef.current) {
      treeRef.current.scale.setScalar(isVisible ? 1 : 0);
    }
  });

  return <primitive ref={treeRef} object={treeModel.scene} position={position} />;
};

export default TreeComponent;
