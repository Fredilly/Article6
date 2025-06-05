import React from 'react'
import { Canvas } from '@react-three/fiber'
import Plane from '../VehiclesComponent/planes' // assuming you've updated the component as shown earlier

const balloonConfigs = [
  { angle: 0, speed: 0.06, alt: 0.2, inc: 0.3, ellipse: 1.1 },
  { angle: Math.PI / 3, speed: 0.08, alt: 0.25, inc: 0.4, ellipse: 1 },
  { angle: Math.PI * 2 / 3, speed: 0.07, alt: 0.3, inc: 0.25, ellipse: 0.95 },
  { angle: Math.PI, speed: 0.05, alt: 0.35, inc: 0.5, ellipse: 1.2 },
  { angle: Math.PI * 4 / 3, speed: 0.04, alt: 0.22, inc: 0.6, ellipse: 0.85 },
  { angle: Math.PI * 5 / 3, speed: 0.09, alt: 0.28, inc: 0.35, ellipse: 1.05 },
]

const Scene = () => {
  return (
    <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
      {balloonConfigs.map((cfg, i) => (
        <Plane
          key={i}
          rotationSpeed={cfg.speed}
          initialAngle={cfg.angle}
          altitude={cfg.alt}
          inclination={cfg.inc}
          ellipseFactor={cfg.ellipse}
        />
      ))}
    </Canvas>
  )
}

export default Scene

