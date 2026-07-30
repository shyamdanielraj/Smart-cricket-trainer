import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

export type LoadedGltf = {
  scene: THREE.Group
  animations: THREE.AnimationClip[]
}

type LoaderOpts = {
  dracoPath?: string
  meshopt: boolean
}

const DRACO_URLS = [
  'https://www.gstatic.com/draco/versioned/decoders/1.5.5/',
  'https://cdn.jsdelivr.net/npm/three@0.183.2/examples/jsm/libs/draco/gltf/',
]

function buildLoader(opts: LoaderOpts): GLTFLoader {
  const loader = new GLTFLoader()
  if (opts.dracoPath) {
    const draco = new DRACOLoader()
    draco.setDecoderPath(opts.dracoPath)
    loader.setDRACOLoader(draco)
  }
  if (opts.meshopt) {
    loader.setMeshoptDecoder(MeshoptDecoder as unknown as Parameters<GLTFLoader['setMeshoptDecoder']>[0])
  }
  return loader
}

function loadWith(loader: GLTFLoader, url: string): Promise<LoadedGltf> {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        resolve({
          scene: gltf.scene as THREE.Group,
          animations: gltf.animations || [],
        })
      },
      undefined,
      (err) => reject(err instanceof Error ? err : new Error(String(err))),
    )
  })
}

/**
 * Try several GLTFLoader setups (Draco CDN mirrors, meshopt on/off).
 * Many exports fail when only one of gstatic / meshopt / plain path works.
 */
export async function loadGltfRobust(url: string): Promise<LoadedGltf> {
  const attempts: LoaderOpts[] = [
    { dracoPath: DRACO_URLS[0], meshopt: true },
    { dracoPath: DRACO_URLS[1], meshopt: true },
    { dracoPath: DRACO_URLS[0], meshopt: false },
    { dracoPath: DRACO_URLS[1], meshopt: false },
    { meshopt: false },
  ]

  let last: Error | null = null
  for (const opts of attempts) {
    try {
      const loader = buildLoader(opts)
      return await loadWith(loader, url)
    } catch (e) {
      last = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw last ?? new Error('GLTF load failed')
}

export function disposeGltfScene(scene: THREE.Object3D) {
  scene.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const m = mesh.material
    if (Array.isArray(m)) m.forEach((x) => x.dispose())
    else m?.dispose()
  })
}
