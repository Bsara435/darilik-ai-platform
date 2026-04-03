import { Canvas, useFrame } from '@react-three/fiber'
import { Float, MeshDistortMaterial, OrbitControls, ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import styles from './Hero.module.css'

function HeroShape() {
  const meshRef = useRef(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.35) * 0.08 + THREE.MathUtils.degToRad(-8)
  })

  return (
    <Float speed={1.8} rotationIntensity={0.35} floatIntensity={0.55}>
      <mesh ref={meshRef} scale={1.2} rotation={[0.2, 0.6, 0]}>
        <torusKnotGeometry args={[0.85, 0.26, 160, 32]} />
        <MeshDistortMaterial
          color="#0d9488"
          emissive="#134e4a"
          emissiveIntensity={0.15}
          metalness={0.42}
          roughness={0.22}
          distort={0.32}
          speed={2.2}
        />
      </mesh>
    </Float>
  )
}

export default function HeroScene3D() {
  return (
    <div className={styles.heroCanvasWrap}>
      <Canvas
        camera={{ position: [0, 0.2, 4.8], fov: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[10, 12, 8]} intensity={1.15} castShadow />
        <directionalLight position={[-8, -2, -6]} intensity={0.4} color="#38bdf8" />
        <HeroShape />
        <ContactShadows
          position={[0, -1.25, 0]}
          opacity={0.38}
          scale={14}
          blur={2.8}
          far={4.5}
          color="#0f172a"
        />
        <OrbitControls
          enableZoom={false}
          autoRotate
          autoRotateSpeed={0.65}
          maxPolarAngle={Math.PI / 2.05}
          minPolarAngle={Math.PI / 4}
          enablePan={false}
        />
      </Canvas>
    </div>
  )
}
