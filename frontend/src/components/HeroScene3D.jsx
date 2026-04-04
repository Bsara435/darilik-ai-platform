import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, OrbitControls, Outlines, RoundedBox } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import styles from './Hero.module.css'

/** Palette aligned with DariLik (index.css) + soft illustration accents */
const C = {
  ink: '#0f172a',
  wall: '#ffffff',
  roof: '#0f766e',
  roofLight: '#14b8a6',
  door: '#115e59',
  window: '#60a5fa',
  windowDeep: '#2563eb',
  yellow: '#fbbf24',
  yellowSoft: '#fde68a',
  grass: '#5eead4',
  grassDark: '#2dd4bf',
  bush: '#86efac',
  cloud: '#ffffff',
  backdrop: '#dbeafe',
  frame: '#f1f5f9',
}

function ToonFill({ color, ...props }) {
  return <meshToonMaterial color={color} gradientMap={null} />
}

function OutlineWrap({ thickness = 0.028, color = C.ink }) {
  return <Outlines thickness={thickness} color={color} angle={Math.PI} />
}

function GableRoofGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-1.08, 0)
    shape.lineTo(1.08, 0)
    shape.lineTo(0, 0.92)
    shape.closePath()
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 1.08,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 2,
    })
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0, -0.54)
    return geo
  }, [])
}

function PuffyCloud({ scale = 1 }) {
  const s = 0.14 * scale
  return (
    <group>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[s, 12, 12]} />
        <ToonFill color={C.cloud} />
        <OutlineWrap thickness={0.022} />
      </mesh>
      <mesh position={[s * 0.85, -s * 0.15, 0.06]} castShadow>
        <sphereGeometry args={[s * 0.72, 10, 10]} />
        <ToonFill color={C.cloud} />
        <OutlineWrap thickness={0.02} />
      </mesh>
      <mesh position={[-s * 0.75, -s * 0.1, -0.05]} castShadow>
        <sphereGeometry args={[s * 0.65, 10, 10]} />
        <ToonFill color={C.cloud} />
        <OutlineWrap thickness={0.02} />
      </mesh>
      <mesh position={[s * 0.45, s * 0.25, 0.12]} castShadow>
        <sphereGeometry args={[s * 0.5, 8, 8]} />
        <ToonFill color={C.cloud} />
        <OutlineWrap thickness={0.018} />
      </mesh>
    </group>
  )
}

function OrbitingCloud({ radius, height, speed, phase, scale }) {
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime * speed + phase
    ref.current.position.x = Math.cos(t) * radius
    ref.current.position.z = Math.sin(t) * radius
    ref.current.position.y = height + Math.sin(t * 1.3 + phase) * 0.08
  })
  return (
    <group ref={ref}>
      <PuffyCloud scale={scale} />
    </group>
  )
}

function CuteHouse() {
  const roofGeo = GableRoofGeometry()
  const houseRef = useRef(null)

  useFrame((_, delta) => {
    if (!houseRef.current) return
    houseRef.current.rotation.y += delta * 0.28
  })

  return (
    <group ref={houseRef} position={[0, -0.05, 0]}>
      {/* Ground mound */}
      <mesh position={[0, -0.62, 0]} receiveShadow castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.45, 48]} />
        <meshToonMaterial color={C.grass} gradientMap={null} />
        <OutlineWrap thickness={0.024} />
      </mesh>

      {/* Body */}
      <RoundedBox args={[1.55, 1.02, 1.02]} radius={0.08} smoothness={4} position={[0, 0, 0]} castShadow>
        <ToonFill color={C.wall} />
        <OutlineWrap />
      </RoundedBox>

      {/* Roof */}
      <mesh geometry={roofGeo} position={[0, 0.56, 0]} castShadow>
        <ToonFill color={C.roof} />
        <OutlineWrap thickness={0.03} />
      </mesh>
      <mesh position={[0, 1.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <boxGeometry args={[1.22, 0.09, 1.22]} />
        <meshToonMaterial color={C.roofLight} gradientMap={null} />
        <OutlineWrap thickness={0.022} />
      </mesh>

      {/* Chimney */}
      <RoundedBox
        args={[0.22, 0.38, 0.22]}
        radius={0.04}
        smoothness={3}
        position={[0.52, 0.92, 0.28]}
        castShadow
      >
        <ToonFill color={C.roof} />
        <OutlineWrap />
      </RoundedBox>
      <mesh position={[0.52, 1.14, 0.28]} castShadow>
        <boxGeometry args={[0.26, 0.06, 0.26]} />
        <ToonFill color={C.roofLight} />
        <OutlineWrap thickness={0.02} />
      </mesh>

      {/* Door + frame */}
      <RoundedBox args={[0.4, 0.64, 0.05]} radius={0.04} position={[0, -0.14, 0.53]} castShadow>
        <ToonFill color={C.door} />
        <OutlineWrap />
      </RoundedBox>
      <mesh position={[-0.12, -0.14, 0.56]}>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshToonMaterial color={C.yellow} emissive={C.yellowSoft} emissiveIntensity={0.35} gradientMap={null} />
        <OutlineWrap thickness={0.018} />
      </mesh>

      {/* Lower windows */}
      {[
        [-0.48, 0.08, 0.53],
        [0.48, 0.08, 0.53],
      ].map((pos, i) => (
        <group key={i} position={pos}>
          <RoundedBox args={[0.36, 0.36, 0.06]} radius={0.05} position={[0, 0, 0]}>
            <ToonFill color={C.frame} />
            <OutlineWrap />
          </RoundedBox>
          <RoundedBox args={[0.26, 0.26, 0.04]} radius={0.03} position={[0, 0, 0.04]}>
            <meshToonMaterial color={C.window} gradientMap={null} />
            <OutlineWrap thickness={0.02} />
          </RoundedBox>
          <mesh position={[0, 0, 0.051]}>
            <boxGeometry args={[0.02, 0.28, 0.01]} />
            <meshToonMaterial color={C.frame} />
          </mesh>
          <mesh position={[0, 0, 0.051]}>
            <boxGeometry args={[0.28, 0.02, 0.01]} />
            <meshToonMaterial color={C.frame} />
          </mesh>
        </group>
      ))}

      {/* Attic arched window (yellow glow) */}
      <group position={[0, 0.42, 0.53]}>
        <mesh castShadow>
          <sphereGeometry args={[0.22, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshToonMaterial
            color={C.yellowSoft}
            emissive={C.yellow}
            emissiveIntensity={0.45}
            gradientMap={null}
          />
          <OutlineWrap thickness={0.022} />
        </mesh>
        <mesh position={[0, 0.02, 0.02]}>
          <boxGeometry args={[0.02, 0.2, 0.02]} />
          <meshToonMaterial color={C.wall} />
        </mesh>
        <mesh position={[0, 0.02, 0.02]}>
          <boxGeometry args={[0.2, 0.02, 0.02]} />
          <meshToonMaterial color={C.wall} />
        </mesh>
      </group>

      {/* Bushes */}
      {[
        [-0.95, -0.35, 0.35, 0.85],
        [-0.82, -0.38, -0.42, 0.72],
        [0.88, -0.36, 0.28, 0.78],
        [0.92, -0.34, -0.38, 0.68],
      ].map(([x, y, z, sc], i) => (
        <mesh key={i} position={[x, y, z]} castShadow scale={sc}>
          <sphereGeometry args={[0.22, 12, 10]} />
          <meshToonMaterial color={C.bush} gradientMap={null} />
          <OutlineWrap thickness={0.02} />
        </mesh>
      ))}

      {/* Tiny potted plant */}
      <group position={[0.42, -0.42, 0.52]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.07, 0.14, 12]} />
          <meshToonMaterial color="#fca5a5" gradientMap={null} />
          <OutlineWrap thickness={0.018} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshToonMaterial color={C.grassDark} gradientMap={null} />
          <OutlineWrap thickness={0.016} />
        </mesh>
      </group>
    </group>
  )
}

function BackdropDisc() {
  return (
    <mesh position={[0, 0.15, -1.65]} renderOrder={-10}>
      <circleGeometry args={[2.35, 64]} />
      <meshBasicMaterial color={C.backdrop} toneMapped={false} />
    </mesh>
  )
}

function SceneContent() {
  return (
    <>
      <BackdropDisc />
      <ambientLight intensity={0.62} />
      <directionalLight position={[8, 14, 10]} intensity={1.05} castShadow color="#ffffff" />
      <directionalLight position={[-6, 4, -8]} intensity={0.38} color="#93c5fd" />
      <hemisphereLight args={['#e0f2fe', '#5eead4', 0.35]} />

      <OrbitingCloud radius={2.05} height={1.05} speed={0.09} phase={0} scale={1.05} />
      <OrbitingCloud radius={1.75} height={1.35} speed={-0.11} phase={1} scale={0.9} />
      <OrbitingCloud radius={2.35} height={0.75} speed={0.075} phase={2.4} scale={0.85} />
      <OrbitingCloud radius={1.55} height={1.55} speed={-0.085} phase={4.1} scale={0.75} />

      <CuteHouse />

      <ContactShadows
        position={[0, -1.18, 0]}
        opacity={0.32}
        scale={12}
        blur={2.4}
        far={4.2}
        color="#0f172a"
      />
      <OrbitControls
        enableZoom={false}
        autoRotate={false}
        maxPolarAngle={Math.PI / 2.08}
        minPolarAngle={Math.PI / 4.2}
        enablePan={false}
        maxAzimuthAngle={Math.PI / 2.5}
        minAzimuthAngle={-Math.PI / 2.5}
      />
    </>
  )
}

export default function HeroScene3D() {
  return (
    <div className={styles.heroCanvasWrap}>
      <Canvas
        camera={{ position: [0, 0.35, 4.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        shadows
        dpr={[1, 2]}
      >
        <SceneContent />
      </Canvas>
    </div>
  )
}
