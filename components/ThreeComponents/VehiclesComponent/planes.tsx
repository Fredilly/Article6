import React, { useRef, useEffect } from 'react'
import { useLoader, useFrame } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { Mesh, Group } from 'three'

interface PlaneProps {
  rotationSpeed?: number
  initialAngle?: number
  altitude?: number
  inclination?: number // orbit tilt in radians
  ellipseFactor?: number // non-uniform orbit shape
}

const Plane: React.FC<PlaneProps> = ({
  rotationSpeed = 0.1,
  initialAngle = 0,
  altitude = 0.3,
  inclination = 0.4, // vertical tilt of orbit
  ellipseFactor = 1, // makes orbit slightly elliptical
}) => {
  const planeModel = useLoader(GLTFLoader, '/assets/vehicles/planes/hot_air_balloon.glb')
  const planeRef = useRef<Group>(null)
  const globeRadius = 1.5

  useEffect(() => {
    if (planeModel.scene) {
      planeModel.scene.scale.set(0.005, 0.005, 0.005)
      planeModel.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.castShadow = true
        }
      })
    }
  }, [planeModel])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const angle = initialAngle + t * rotationSpeed

    const r = globeRadius + altitude
    const x = r * Math.cos(angle) * ellipseFactor
    const z = r * Math.sin(angle)
    const y = r * Math.sin(angle * 1.5) * inclination // tilt variation

    if (planeRef.current) {
      planeRef.current.position.set(x, y, z)
      planeRef.current.lookAt(0, 0, 0)
    }
  })

  return <group ref={planeRef}><primitive object={planeModel.scene} /></group>
}

export default Plane
