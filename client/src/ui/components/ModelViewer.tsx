import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { disposeGltfScene, loadGltfRobust, type LoadedGltf } from '../../lib/loadGltfRobust'

type Props = {
  modelUrl: string
  playing?: boolean
}

/**
 * HEAD/GET probe so we don't throw into GLTFLoader when the file is missing (common 404).
 */
function useModelFileExists(url: string): 'checking' | 'yes' | 'no' {
  const [state, setState] = useState<'checking' | 'yes' | 'no'>('checking')

  useEffect(() => {
    let cancelled = false
    setState('checking')

    const run = async () => {
      try {
        let ok = false
        const head = await fetch(url, { method: 'HEAD', cache: 'no-cache' })
        if (cancelled) return
        if (head.ok) {
          ok = true
        } else if (head.status === 405 || head.status === 501) {
          const get = await fetch(url, { method: 'GET', cache: 'no-cache' })
          if (cancelled) return
          ok = get.ok
        } else {
          const get = await fetch(url, { method: 'GET', cache: 'no-cache' })
          if (cancelled) return
          ok = get.ok
        }
        setState(ok ? 'yes' : 'no')
      } catch {
        if (!cancelled) setState('no')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [url])

  return state
}

export function ModelViewer({ modelUrl, playing = true }: Props) {
  const exists = useModelFileExists(modelUrl)

  const onCreated = ({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) => {
    // Rendering quality: keep changes incremental and safe for performance.
    // These are renderer settings only (no changes to loading/controls).
    ;(gl as any).physicallyCorrectLights = true
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.45
    // Three r152+: outputColorSpace; older: outputEncoding.
    if ((gl as any).outputColorSpace != null) {
      ;(gl as any).outputColorSpace = (THREE as any).SRGBColorSpace
    } else {
      // Legacy fallback: keep numeric constant to avoid relying on removed exports.
      ;(gl as any).outputEncoding = 3001
    }

    // Environment-style lighting without loading HDRI assets (safe fallback).
    // Hemisphere light already provides most of the "environment" feel,
    // but setting a subtle environment can improve PBR material response.
    scene.environment = null
  }

  if (exists === 'checking') {
    return (
      <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <Canvas
          camera={{ position: [2.2, 1.6, 2.6], fov: 45 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={onCreated}
        >
          <color attach="background" args={['#05070c']} />
          <SceneLights />
          <mesh>
            <boxGeometry args={[0.35, 0.35, 0.35]} />
            <meshStandardMaterial color="#00FFAB" wireframe />
          </mesh>
          <OrbitControls enablePan enableZoom enableRotate makeDefault />
        </Canvas>
        <p className="mt-2 text-center text-xs text-white/50">Loading 3D view…</p>
      </div>
    )
  }

  if (exists === 'no') {
    return (
      <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
        <p className="mb-2 text-xs text-amber-200/90">
          We couldn’t load this 3D batting style, so we’re showing a demo model instead.
        </p>
        <div className="h-[480px]">
          <Canvas
            shadows
            camera={{ position: [2.2, 1.6, 2.6], fov: 45 }}
            gl={{ antialias: true, alpha: false }}
            onCreated={onCreated}
          >
            <SceneLights />
            <OrbitControls enablePan enableZoom enableRotate makeDefault />
            <StadiumFloor />
            <PlaceholderBatter playing={playing} showLabel />
          </Canvas>
        </div>
      </div>
    )
  }

  /* exists === 'yes' — robust GLTF decode (Draco CDN mirrors, meshopt on/off) */
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      <Canvas
        shadows
        camera={{ position: [2.2, 1.6, 2.6], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        onCreated={onCreated}
      >
        <color attach="background" args={['#05070c']} />
        <SceneLights />
        <StadiumFloor />
        <GltfBattingModel url={modelUrl} playing={playing} />
        <OrbitControls enablePan enableZoom enableRotate makeDefault />
      </Canvas>
    </div>
  )
}

function SceneLights() {
  return (
    <>
      <color attach="background" args={['#05070c']} />
      {/* Soft global illumination */}
      <ambientLight intensity={0.95} />
      {/* Environment-style light (safe fallback vs HDRI) */}
      <hemisphereLight intensity={0.9} color="#ffffff" groundColor="#0B1F3A" />
      {/* Key light (top-front) */}
      <directionalLight
        castShadow
        intensity={1.85}
        position={[5, 10, 5]}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.00015}
      />
      {/* Fill light (opposite side, softer) */}
      <directionalLight intensity={0.55} position={[-4, 6, -3]} />
    </>
  )
}

function StadiumFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <circleGeometry args={[6, 64]} />
      <meshStandardMaterial color="#0B1F3A" roughness={0.95} metalness={0.05} />
    </mesh>
  )
}

function PlaceholderBatter({
  playing,
  showLabel,
  labelText,
}: {
  playing: boolean
  showLabel?: boolean
  labelText?: string
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame(() => {
    if (!playing || !ref.current) return
    ref.current.rotation.y = Math.sin(performance.now() / 450) * 0.35
  })

  return (
    <group ref={ref}>
      {showLabel ? (
        <Html position={[0, 2.15, 0]} center className="pointer-events-none select-none">
          <span className="max-w-[220px] whitespace-normal rounded-lg border border-white/20 bg-black/70 px-2 py-1 text-center text-[10px] font-medium text-neon-green shadow-lg">
            {labelText ?? 'Demo stance'}
          </span>
        </Html>
      ) : null}
      <mesh position={[0, 1.05, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.55, 6, 12]} />
        <meshStandardMaterial
          color="#00FFAB"
          metalness={0.25}
          roughness={0.45}
          emissive="#002218"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 1.52, 0]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#e8cfc4" roughness={0.7} />
      </mesh>
      <mesh position={[0.32, 1.05, 0.05]} rotation={[0.15, 0, Math.PI / 5]} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 1.15, 10]} />
        <meshStandardMaterial color="#d4a574" metalness={0.15} roughness={0.55} />
      </mesh>
    </group>
  )
}

/**
 * Loads GLB with several loader setups (fixes many Draco / Meshopt / CDN issues vs useGLTF alone).
 */
function GltfBattingModel({ url, playing }: { url: string; playing: boolean }) {
  const loadGen = useRef(0)
  const [data, setData] = useState<LoadedGltf | null>(null)
  const [phase, setPhase] = useState<'loading' | 'ready' | 'fail'>('loading')
  const group = useRef<THREE.Group>(null)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  useEffect(() => {
    const id = ++loadGen.current
    setPhase('loading')
    setData(null)

    loadGltfRobust(url)
      .then((d) => {
        if (loadGen.current !== id) {
          disposeGltfScene(d.scene)
          return
        }
        setData(d)
        setPhase('ready')
      })
      .catch((err) => {
        console.warn('[Smart Cricket] GLB decode failed after all strategies:', url, err)
        if (loadGen.current === id) setPhase('fail')
      })

    return () => {
      /* next effect run bumps loadGen; in-flight result will dispose in then */
    }
  }, [url])

  useEffect(() => {
    if (!data?.scene) return
    const scene = data.scene
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3()).length()
    const scale = size > 0 ? 1.6 / size : 1
    scene.scale.setScalar(scale)

    // After scaling, re-compute bounds and place the model "on the floor".
    // Many GLBs have their origin around the hips/center, which can make the floor look like it's slicing the mesh.
    const box2 = new THREE.Box3().setFromObject(scene)
    const center = box2.getCenter(new THREE.Vector3())
    const liftY = -box2.min.y + 0.01
    scene.position.set(-center.x, liftY, -center.z)

    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh
        m.castShadow = true
        m.receiveShadow = true
        const mat = m.material
        const boost = (one: THREE.Material) => {
          const anyMat = one as unknown as { envMapIntensity?: number; needsUpdate?: boolean }
          if (typeof anyMat.envMapIntensity === 'number') {
            anyMat.envMapIntensity = Math.max(anyMat.envMapIntensity, 1.25)
            anyMat.needsUpdate = true
          }
        }
        if (Array.isArray(mat)) mat.forEach(boost)
        else if (mat) boost(mat)
      }
    })
  }, [data])

  useEffect(() => {
    if (!data) {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
      return
    }
    const m = new THREE.AnimationMixer(data.scene)
    mixerRef.current = m
    return () => {
      m.stopAllAction()
      mixerRef.current = null
    }
  }, [data])

  useEffect(() => {
    const mixer = mixerRef.current
    if (!mixer || !data?.animations?.length || !playing) return
    const action = mixer.clipAction(data.animations[0])
    action.reset().fadeIn(0.2).play()
    return () => {
      action.fadeOut(0.1)
      action.stop()
    }
  }, [data?.animations, playing, data])

  useEffect(() => {
    return () => {
      if (data?.scene) disposeGltfScene(data.scene)
    }
  }, [data])

  useFrame((_s, delta) => {
    if (!playing) return
    const mixer = mixerRef.current
    if (phase === 'ready' && mixer && data?.animations?.length) {
      mixer.update(delta)
      return
    }
    if (phase === 'ready' && group.current && (!data?.animations?.length || !mixer)) {
      group.current.rotation.y = Math.sin(performance.now() / 450) * 0.25
    }
  })

  if (phase === 'loading') {
    return (
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#00FFAB" wireframe />
      </mesh>
    )
  }

  if (phase === 'fail') {
    return (
      <PlaceholderBatter
        playing={playing}
        showLabel
        labelText="We couldn’t load this 3D style. Showing a demo model instead."
      />
    )
  }

  if (!data) return null

  return (
    <group ref={group}>
      <primitive object={data.scene} />
    </group>
  )
}
