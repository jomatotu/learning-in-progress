// The WebGL part of Scene3D, loaded on demand (React.lazy) so three.js is its own chunk.
import { Canvas } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import type { ScenePart } from './Scene3D'

const clamp = (n: unknown, min: number, max: number, fallback: number) =>
  typeof n === 'number' && Number.isFinite(n)
    ? Math.min(max, Math.max(min, n))
    : fallback

function Geometry({
  shape,
  size,
}: {
  shape: ScenePart['shape']
  size: number
}) {
  if (shape === 'box') return <boxGeometry args={[size, size, size]} />
  if (shape === 'cylinder')
    return <cylinderGeometry args={[size / 2, size / 2, size, 32]} />
  if (shape === 'torus')
    return <torusGeometry args={[size / 2, size / 6, 16, 48]} />
  return <sphereGeometry args={[size / 2, 32, 32]} />
}

export default function SceneCanvas({
  parts,
  selected,
  onSelect,
  autoRotate,
}: {
  parts: ScenePart[]
  selected: number | null
  onSelect: (index: number) => void
  autoRotate: boolean
}) {
  return (
    <Canvas camera={{ position: [0, 1.5, 6], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      {parts.map((part, i) => {
        const size = clamp(part.size, 0.1, 3, 1)
        const [x, y, z] = [0, 1, 2].map((axis) =>
          clamp(part.position?.[axis], -4, 4, 0),
        )
        return (
          <mesh
            key={i}
            position={[x, y, z]}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(i)
            }}
          >
            <Geometry shape={part.shape} size={size} />
            <meshStandardMaterial
              color={part.color ?? '#6955c6'}
              emissive="#ffffff"
              emissiveIntensity={selected === i ? 0.25 : 0}
            />
            <Html
              center
              position={[0, size / 2 + 0.35, 0]}
              className="pointer-events-none"
            >
              <span className="rounded-full bg-sheet/90 px-2 py-0.5 text-sm whitespace-nowrap text-ink">
                {part.label}
              </span>
            </Html>
          </mesh>
        )
      })}
      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={0.8}
        enablePan={false}
      />
    </Canvas>
  )
}
