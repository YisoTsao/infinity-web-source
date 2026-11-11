'use client'
/* eslint-disable react-hooks/immutability -- three.js materials/uniforms are imperative handles mutated per frame by design */
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { BODIES, BELT, type Body } from '@/content/cosmos'
import { cosmosState } from '@/stores/cosmos'
import { useUI, selectReduced, type Tier } from '@/stores/ui'
import { pointer } from '@/motion/pointer'
import { frameAt, chapterAt, type Frame } from './shots'
import { SURFACE_VERT, SURFACE_FRAG, CLOUD_FRAG, SUN_FRAG, FLAME_VERT, FLAME_FRAG, HALO2_FRAG, BODY_ID } from './surfaces'
import {
  PLANET_VERT, RING_VERT, RING_FRAG, STAR_VERT, STAR_FRAG, NEBULA_FRAG,
  DUST_VERT, DUST_POINT_FRAG, DUST_LINE_FRAG, METEOR_VERT, METEOR_FRAG,
} from './glsl'

const Q = {
  high: { dpr: 2, stars: 9000, dust: 2600, rocks: 1600, kuiper: 2400, seg: 96 },
  mid: { dpr: 1.5, stars: 6000, dust: 1600, rocks: 900, kuiper: 1400, seg: 72 },
  low: { dpr: 1.5, stars: 3500, dust: 900, rocks: 450, kuiper: 800, seg: 56 },
} satisfies Record<Tier, Record<string, number>>

const SUN = new THREE.Vector3(...BODIES.sun.pos)

/** Seeded PRNG so every visit builds the same sky. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// ─── Camera ──────────────────────────────────────────────────────────────
function CameraRig({ parallax }: { parallax: boolean }) {
  const f = useMemo<Frame>(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3(), roll: 0, fov: 40 }), [])
  const last = useMemo(() => new THREE.Vector3(), [])
  const vel = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])
  const right = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(), [])
  const look = useRef({ x: 0, y: 0 })
  const first = useRef(true)

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera
    const dt = Math.min(delta, 0.05)
    const s = cosmosState
    let jumped = false
    if (s.snap || first.current) {
      s.progress = s.target
      s.snap = false
      jumped = true
      first.current = false
    } else s.progress += (s.target - s.progress) * (1 - Math.exp(-dt * 7))

    frameAt(s.progress, f)
    const { index, local } = chapterAt(s.progress)
    s.chapter = index
    s.local = local

    // pointer parallax: a small orbit around the subject, proportional to framing distance
    const lk = 1 - Math.exp(-dt * 3)
    look.current.x += ((parallax ? pointer.nx : 0) - look.current.x) * lk
    look.current.y += ((parallax ? pointer.ny : 0) - look.current.y) * lk
    const dist = f.pos.distanceTo(f.target)
    tmp.subVectors(f.target, f.pos).normalize()
    right.crossVectors(tmp, THREE.Object3D.DEFAULT_UP).normalize()
    up.crossVectors(right, tmp).normalize()
    cam.position.copy(f.pos).addScaledVector(right, look.current.x * dist * 0.035).addScaledVector(up, look.current.y * dist * 0.025)
    cam.up.set(0, 1, 0)
    cam.lookAt(f.target)
    cam.rotateZ(f.roll)
    const fov = f.fov + s.warp * 35
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }

    if (jumped) last.copy(cam.position)
    tmp.subVectors(cam.position, last).divideScalar(Math.max(dt, 1e-3))
    vel.lerp(tmp, 1 - Math.exp(-dt * 10))
    last.copy(cam.position)
    s.speed = vel.length()
    state.scene.userData.camVel = vel
  })
  return null
}

// ─── Backdrop: nebula sphere + far stars, both locked to the camera position ─
function Backdrop({ stars, twinkle }: { stars: number; twinkle: boolean }) {
  const group = useRef<THREE.Group>(null)
  const dpr = useThree((s) => s.viewport.dpr)
  const { geo, mat, nebula } = useMemo(() => {
    const r = rng(42)
    const pos = new Float32Array(stars * 3)
    const size = new Float32Array(stars)
    const phase = new Float32Array(stars)
    const col = new Float32Array(stars * 3)
    const tints = [new THREE.Color('#ffffff'), new THREE.Color('#cfe0ff'), new THREE.Color('#ffe2c4'), new THREE.Color('#e9f7ff')]
    for (let i = 0; i < stars; i++) {
      const u = r() * 2 - 1
      const th = r() * Math.PI * 2
      // denser band across the sky, like a galactic plane
      const y = r() < 0.45 ? (r() - 0.5) * 0.35 : u
      const k = Math.sqrt(1 - y * y)
      pos.set([Math.cos(th) * k * 5000, y * 5000, Math.sin(th) * k * 5000], i * 3)
      size[i] = 0.9 + Math.pow(r(), 9) * 6.5
      phase[i] = r()
      const c = tints[Math.floor(r() * tints.length)]
      const b = 0.35 + r() * 0.65
      col.set([c.r * b, c.g * b, c.b * b], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uTwinkle: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const nebula = new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: NEBULA_FRAG,
      uniforms: { uTime: { value: 0 } },
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false,
    })
    return { geo, mat, nebula }
  }, [stars])

  useEffect(() => () => (geo.dispose(), mat.dispose(), nebula.dispose()), [geo, mat, nebula])

  useFrame((state) => {
    group.current!.position.copy(state.camera.position)
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uDpr.value = dpr
    mat.uniforms.uTwinkle.value = twinkle ? 1 : 0
    nebula.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group ref={group}>
      <mesh material={nebula} renderOrder={-2} frustumCulled={false}>
        <sphereGeometry args={[6000, 48, 24]} />
      </mesh>
      <points geometry={geo} material={mat} renderOrder={-1} frustumCulled={false} />
    </group>
  )
}

// ─── Near-field dust & warp streaks (world-wrapped cube around the camera) ─
function Dust({ count, streaks }: { count: number; streaks: boolean }) {
  const S = 320
  const dpr = useThree((s) => s.viewport.dpr)
  const { pts, lines, pMat, lMat } = useMemo(() => {
    const r = rng(7)
    const base = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i++) base[i] = r() * S
    const pts = new THREE.BufferGeometry()
    pts.setAttribute('position', new THREE.BufferAttribute(base, 3))
    pts.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(count), 1))
    const lp = new Float32Array(count * 6)
    const le = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      lp.set(base.subarray(i * 3, i * 3 + 3), i * 6)
      lp.set(base.subarray(i * 3, i * 3 + 3), i * 6 + 3)
      le[i * 2 + 1] = 1
    }
    const lines = new THREE.BufferGeometry()
    lines.setAttribute('position', new THREE.BufferAttribute(lp, 3))
    lines.setAttribute('aEnd', new THREE.BufferAttribute(le, 1))
    const uniforms = () => ({
      uCam: { value: new THREE.Vector3() },
      uWrap: { value: new THREE.Vector3() },
      uS: { value: S },
      uVel: { value: new THREE.Vector3() },
      uDpr: { value: 1 },
      uSize: { value: 2.2 },
      uAlpha: { value: 0.6 },
    })
    const common = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }
    const pMat = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_POINT_FRAG, uniforms: uniforms(), ...common })
    const lMat = new THREE.ShaderMaterial({ vertexShader: DUST_VERT, fragmentShader: DUST_LINE_FRAG, uniforms: uniforms(), ...common })
    return { pts, lines, pMat, lMat }
  }, [count])

  useEffect(() => () => (pts.dispose(), lines.dispose(), pMat.dispose(), lMat.dispose()), [pts, lines, pMat, lMat])

  const wrap = useMemo(() => new THREE.Vector3(), [])
  const fwd = useMemo(() => new THREE.Vector3(), [])
  const streak = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, delta) => {
    const cam = state.camera
    const vel = (state.scene.userData.camVel as THREE.Vector3 | undefined) ?? streak.set(0, 0, 0)
    cam.getWorldDirection(fwd)
    // warp drive: slide the wrap origin forward so the field rushes past even when the camera holds still
    wrap.addScaledVector(fwd, cosmosState.warp * 900 * Math.min(delta, 0.05))
    const len = Math.min(vel.length() * 0.09, 140)
    streak.copy(vel).setLength(len).addScaledVector(fwd, cosmosState.warp * 120)
    const sp = Math.min((len + cosmosState.warp * 120) / 18, 1)
    for (const m of [pMat, lMat]) {
      m.uniforms.uCam.value.copy(cam.position)
      m.uniforms.uWrap.value.copy(cam.position).add(wrap)
      m.uniforms.uDpr.value = dpr
    }
    lMat.uniforms.uVel.value.copy(streak)
    lMat.uniforms.uAlpha.value = streaks ? sp * 0.9 : 0
    pMat.uniforms.uAlpha.value = 0.55 * (1 - sp * 0.6)
  })

  return (
    <>
      <points geometry={pts} material={pMat} frustumCulled={false} />
      <lineSegments geometry={lines} material={lMat} frustumCulled={false} />
    </>
  )
}

// ─── Meteors: a small pool of tapered additive streaks ───────────────────
type Meteor = { mat: THREE.ShaderMaterial; age: number; life: number; speed: number; on: boolean }
function Meteors({ enabled }: { enabled: boolean }) {
  const POOL = 8
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1, 8, 1), [])
  const pool = useMemo<Meteor[]>(
    () =>
      Array.from({ length: POOL }, () => ({
        mat: new THREE.ShaderMaterial({
          vertexShader: METEOR_VERT,
          fragmentShader: METEOR_FRAG,
          uniforms: {
            uHead: { value: new THREE.Vector3() },
            uDir: { value: new THREE.Vector3(1, 0, 0) },
            uLen: { value: 40 },
            uWidth: { value: 0.8 },
            uLife: { value: 0 },
            uColor: { value: new THREE.Color('#b9f0ff') },
          },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          side: THREE.DoubleSide,
        }),
        age: 0,
        life: 1,
        speed: 200,
        on: false,
      })),
    [],
  )
  useEffect(() => () => (geo.dispose(), pool.forEach((m) => m.mat.dispose())), [geo, pool])

  const acc = useRef(0)
  const t = useMemo(() => ({ f: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3() }), [])
  const colors = useMemo(() => ['#b9f0ff', '#fff1c9', '#d9ffb0', '#ffd0e8'].map((c) => new THREE.Color(c)), [])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const cam = state.camera
    pool.forEach((m) => {
      if (!m.on) return
      m.age += dt
      const k = m.age / m.life
      if (k >= 1) {
        m.on = false
        m.mat.uniforms.uLife.value = 0
        return
      }
      m.mat.uniforms.uHead.value.addScaledVector(m.mat.uniforms.uDir.value, m.speed * dt)
      m.mat.uniforms.uLife.value = Math.sin(Math.PI * k) * 1.4
    })
    if (!enabled) return
    const belt = cosmosState.chapter === 6
    const rate = 0.5 + Math.min(cosmosState.speed / 120, 2.5) + (belt ? 3.5 : 0) + cosmosState.warp * 4
    acc.current += rate * dt
    while (acc.current >= 1) {
      acc.current -= 1
      const m = pool.find((p) => !p.on)
      if (!m) break
      cam.getWorldDirection(t.f)
      t.r.crossVectors(t.f, cam.up).normalize()
      t.u.crossVectors(t.r, t.f).normalize()
      const d = 90 + Math.random() * 220
      const head = m.mat.uniforms.uHead.value as THREE.Vector3
      head
        .copy(cam.position)
        .addScaledVector(t.f, d)
        .addScaledVector(t.r, (Math.random() - 0.5) * d * 1.4)
        .addScaledVector(t.u, (0.1 + Math.random() * 0.5) * d * 0.7)
      const dir = m.mat.uniforms.uDir.value as THREE.Vector3
      dir
        .copy(t.u)
        .multiplyScalar(-0.55 - Math.random() * 0.4)
        .addScaledVector(t.r, (Math.random() - 0.5) * 2)
        .addScaledVector(t.f, (Math.random() - 0.5) * 0.6)
        .normalize()
      m.speed = d * (0.9 + Math.random() * 0.9)
      m.mat.uniforms.uLen.value = d * (0.18 + Math.random() * 0.22)
      m.mat.uniforms.uWidth.value = d * (0.0035 + Math.random() * 0.003)
      m.mat.uniforms.uColor.value.copy(colors[Math.floor(Math.random() * colors.length)])
      m.age = 0
      m.life = 0.7 + Math.random() * 0.8
      m.on = true
    }
  })

  return (
    <>
      {pool.map((m, i) => (
        <mesh key={i} geometry={geo} material={m.mat} frustumCulled={false} />
      ))}
    </>
  )
}

// ─── Planets ─────────────────────────────────────────────────────────────
const SPOTS: Record<string, { dir: [number, number, number]; size: number; color: string }> = {
  jupiter: { dir: [0.45, -0.36, 0.82], size: 0.13, color: '#b9472a' },
  neptune: { dir: [-0.4, -0.38, 0.83], size: 0.1, color: '#081045' },
  pluto: { dir: [0.3, 0.12, 0.95], size: 0.5, color: '#f4ece0' },
}

function planetMaterial(b: Body) {
  const spot = SPOTS[b.id]
  const ringN = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(0, 0, b.tilt ?? 0))
  return new THREE.ShaderMaterial({
    vertexShader: SURFACE_VERT,
    fragmentShader: SURFACE_FRAG,
    uniforms: {
      uId: { value: BODY_ID[b.id as keyof typeof BODY_ID] ?? 1 },
      uA: { value: new THREE.Color(b.colors[0]) },
      uB: { value: new THREE.Color(b.colors[1]) },
      uC: { value: new THREE.Color(b.colors[2]) },
      uSun: { value: SUN },
      uTime: { value: 0 },
      uSeed: { value: b.seed },
      uR: { value: b.radius },
      uAtmo: { value: new THREE.Color(b.atmo ?? '#000000') },
      uAtmoK: { value: b.atmoStrength ?? 0 },
      uSpot: { value: spot ? new THREE.Vector4(...new THREE.Vector3(...spot.dir).normalize().toArray(), spot.size) : new THREE.Vector4(0, 0, 1, 0) },
      uSpotCol: { value: new THREE.Color(spot?.color ?? '#000000') },
      uCenter: { value: new THREE.Vector3(...b.pos) },
      uRingN: { value: ringN },
      uRing: { value: b.id === 'saturn' && b.rings ? new THREE.Vector2(b.rings.inner * b.radius, b.rings.outer * b.radius) : new THREE.Vector2(0, 0) },
    },
  })
}

function Planet({ body, sphere }: { body: Body; sphere: THREE.BufferGeometry }) {
  const spin = useRef<THREE.Group>(null)
  const mat = useMemo(() => planetMaterial(body), [body])
  const clouds = useMemo(() => {
    if (body.id !== 'earth') return null
    return new THREE.ShaderMaterial({
      vertexShader: SURFACE_VERT,
      fragmentShader: CLOUD_FRAG,
      uniforms: { uSun: { value: SUN }, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      premultipliedAlpha: true,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
    })
  }, [body])
  const halo = useMemo(() => {
    if (!body.atmo) return null
    return new THREE.ShaderMaterial({
      vertexShader: PLANET_VERT,
      fragmentShader: HALO2_FRAG,
      uniforms: {
        uCenter: { value: new THREE.Vector3(...body.pos) },
        uR: { value: body.radius },
        uShell: { value: body.radius * 1.14 },
        uSun: { value: SUN },
        uAtmo: { value: new THREE.Color(body.atmo) },
        uK: { value: (body.atmoStrength ?? 1) * 0.9 },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  }, [body])
  const ring = useMemo(() => {
    if (!body.rings) return null
    const { inner, outer, opacity, tint } = body.rings
    const geo = new THREE.RingGeometry(inner * body.radius, outer * body.radius, 256, 1)
    const mat = new THREE.ShaderMaterial({
      vertexShader: RING_VERT,
      fragmentShader: RING_FRAG,
      uniforms: {
        uInner: { value: inner },
        uOuter: { value: outer },
        uR: { value: body.radius },
        uTint: { value: new THREE.Color(tint) },
        uOpacity: { value: opacity },
        uSeed: { value: body.seed },
        uCenter: { value: new THREE.Vector3(...body.pos) },
        uSun: { value: SUN },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    return { geo, mat }
  }, [body])

  useEffect(
    () => () => {
      mat.dispose()
      clouds?.dispose()
      halo?.dispose()
      ring?.geo.dispose()
      ring?.mat.dispose()
    },
    [mat, clouds, halo, ring],
  )

  useFrame((state, delta) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    if (clouds) clouds.uniforms.uTime.value = state.clock.elapsedTime
    if (spin.current) spin.current.rotation.y += (body.spin ?? 0) * Math.min(delta, 0.05)
  })

  return (
    <group position={body.pos} rotation={[0, 0, body.tilt ?? 0]}>
      <group ref={spin}>
        <mesh geometry={sphere} material={mat} scale={body.radius} />
        {clouds && <mesh geometry={sphere} material={clouds} scale={body.radius * 1.012} renderOrder={1} />}
      </group>
      {halo && <mesh geometry={sphere} material={halo} scale={body.radius * 1.14} renderOrder={2} />}
      {ring && <mesh geometry={ring.geo} material={ring.mat} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} />}
    </group>
  )
}

function Moon({ sphere }: { sphere: THREE.BufferGeometry }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useMemo(() => planetMaterial(BODIES.moon), [])
  useEffect(() => () => mat.dispose(), [mat])
  const e = BODIES.earth.pos
  useFrame((state) => {
    const a = state.clock.elapsedTime * 0.12 + 2.2
    ref.current!.position.set(e[0] + Math.cos(a) * 15, e[1] + Math.sin(a * 0.7) * 2.5, e[2] + Math.sin(a) * 15)
    // tidally locked: the same face always looks at Earth
    ref.current!.rotation.y = -a + Math.PI / 2
    mat.uniforms.uCenter.value.copy(ref.current!.position)
  })
  return <mesh ref={ref} geometry={sphere} material={mat} scale={BODIES.moon.radius} />
}

function canvasTexture(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  draw(c.getContext('2d')!, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Sun({ sphere }: { sphere: THREE.BufferGeometry }) {
  const R = BODIES.sun.radius
  const FLAME = R * 2.4
  const flameMesh = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: SURFACE_VERT, fragmentShader: SUN_FRAG, uniforms: { uTime: { value: 0 }, uSun: { value: SUN } } }),
    [],
  )
  const flame = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLAME_VERT,
        fragmentShader: FLAME_FRAG,
        uniforms: { uTime: { value: 0 }, uDisc: { value: 0.4 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const glow = useMemo(
    () =>
      canvasTexture(256, (g, s) => {
        const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
        gr.addColorStop(0, 'rgba(255,240,200,1)')
        gr.addColorStop(0.14, 'rgba(255,190,90,0.8)')
        gr.addColorStop(0.32, 'rgba(255,120,40,0.24)')
        gr.addColorStop(0.62, 'rgba(255,80,20,0.06)')
        gr.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = gr
        g.fillRect(0, 0, s, s)
      }),
    [],
  )
  useEffect(() => () => (mat.dispose(), flame.dispose(), glow.dispose()), [mat, flame, glow])
  useFrame((state) => {
    const t = state.clock.elapsedTime
    mat.uniforms.uTime.value = t
    flame.uniforms.uTime.value = t
    const m = flameMesh.current!
    // billboard through the Sun's centre; size the disc to the true silhouette at this distance
    m.quaternion.copy(state.camera.quaternion)
    const d = Math.max(state.camera.position.distanceTo(SUN), R * 1.05)
    flame.uniforms.uDisc.value = (R * d) / Math.sqrt(d * d - R * R) / FLAME
  })
  return (
    <group>
      <mesh geometry={sphere} material={mat} scale={R} />
      <mesh ref={flameMesh} material={flame} renderOrder={3} frustumCulled={false}>
        <planeGeometry args={[FLAME * 2, FLAME * 2]} />
      </mesh>
      <sprite scale={[R * 9, R * 9, 1]} renderOrder={4}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0.85} />
      </sprite>
      <pointLight position={[0, 0, 0]} intensity={2.4} decay={0} color="#fff1dc" />
    </group>
  )
}

// ─── Asteroid belt (InstancedMesh, static matrices, whole field drifts) ──
function Belt({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null)
  const { mesh, geo, mat } = useMemo(() => {
    const r = rng(99)
    const geo = new THREE.IcosahedronGeometry(1, 1)
    const p = geo.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i)
      // lumpy: displace by a cheap hash of the direction
      const k = 0.72 + 0.5 * Math.abs(Math.sin(v.x * 3.1 + v.y * 5.7) * Math.cos(v.z * 4.3 - v.x * 2.2))
      p.setXYZ(i, v.x * k, v.y * k * 0.85, v.z * k)
    }
    geo.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({ color: '#7d7368', roughness: 1, metalness: 0, flatShading: true })
    const mesh = new THREE.InstancedMesh(geo, mat, count)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const s = new THREE.Vector3()
    const pos = new THREE.Vector3()
    const col = new THREE.Color()
    for (let i = 0; i < count; i++) {
      // keep a clear corridor around the camera's weave path
      for (let tries = 0; tries < 8; tries++) {
        pos.set((r() * 2 - 1) * BELT.halfWidth, (r() * 2 - 1) * BELT.halfHeight * Math.pow(r(), 0.6), BELT.zStart + (BELT.zEnd - BELT.zStart) * r())
        const t = (pos.z - BELT.zStart - 30) / (BELT.zEnd - 20 - BELT.zStart - 30)
        const w = t * Math.PI * 2
        const dx = pos.x - Math.sin(w) * 22
        const dy = pos.y - Math.sin(w * 0.5) * 6
        if (Math.hypot(dx, dy) > 7) break
      }
      const big = r() < 0.04
      const sc = big ? 4 + r() * 7 : 0.25 + Math.pow(r(), 2.2) * 2.6
      if (big && Math.abs(pos.x) < 30) pos.x += Math.sign(pos.x || 1) * 40
      s.set(sc * (0.7 + r() * 0.6), sc * (0.6 + r() * 0.5), sc * (0.7 + r() * 0.6))
      q.setFromEuler(e.set(r() * 6.28, r() * 6.28, r() * 6.28))
      mesh.setMatrixAt(i, m.compose(pos, q, s))
      mesh.setColorAt(i, col.setHSL(0.07 + r() * 0.05, 0.12 + r() * 0.15, 0.32 + r() * 0.3))
    }
    mesh.instanceMatrix.needsUpdate = true
    return { mesh, geo, mat }
  }, [count])
  useEffect(() => () => (geo.dispose(), mat.dispose(), mesh.dispose()), [geo, mat, mesh])
  useFrame((state) => {
    // only shows up near the belt chapter; skip GPU work elsewhere
    const c = cosmosState.chapter
    group.current!.visible = c >= 5 && c <= 7
    group.current!.rotation.z = Math.sin(state.clock.elapsedTime * 0.05) * 0.02
  })
  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  )
}

function Kuiper({ count }: { count: number }) {
  const dpr = useThree((s) => s.viewport.dpr)
  const { geo, mat } = useMemo(() => {
    const r = rng(1234)
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const col = new Float32Array(count * 3)
    const c = BODIES.pluto.pos
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2
      const rad = 25 + Math.pow(r(), 0.7) * 160
      pos.set([c[0] + Math.cos(a) * rad, c[1] + (r() - 0.5) * 18, c[2] + Math.sin(a) * rad], i * 3)
      size[i] = 1 + r() * 2.4
      phase[i] = r()
      const b = 0.25 + r() * 0.45
      col.set([b * 0.9, b * 0.95, b], i * 3)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: { uTime: { value: 0 }, uDpr: { value: 1 }, uTwinkle: { value: 0.3 } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return { geo, mat }
  }, [count])
  useEffect(() => () => (geo.dispose(), mat.dispose()), [geo, mat])
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime
    mat.uniforms.uDpr.value = dpr
  })
  return <points geometry={geo} material={mat} />
}

function World({ tier, reduced, parallax }: { tier: Tier; reduced: boolean; parallax: boolean }) {
  const q = Q[tier]
  const sphere = useMemo(() => new THREE.SphereGeometry(1, q.seg, Math.round(q.seg * 0.66)), [q.seg])
  useEffect(() => () => sphere.dispose(), [sphere])
  const bodies = useMemo(() => Object.values(BODIES).filter((b) => b.id !== 'sun' && b.id !== 'moon'), [])
  return (
    <>
      <CameraRig parallax={parallax} />
      <Backdrop stars={q.stars} twinkle={!reduced} />
      <ambientLight intensity={0.06} />
      <Sun sphere={sphere} />
      {bodies.map((b) => (
        <Planet key={b.id} body={b} sphere={sphere} />
      ))}
      <Moon sphere={sphere} />
      <Belt count={q.rocks} />
      <Kuiper count={q.kuiper} />
      <Dust count={q.dust} streaks={!reduced} />
      <Meteors enabled={!reduced} />
    </>
  )
}

function NoGL() {
  return <div className="cosmos-nogl absolute inset-0" />
}

export default function CosmosScene() {
  const tier = useUI((s) => s.tier)
  const reduced = useUI(selectReduced)
  const fine = useUI((s) => s.finePointer)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const onVis = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return (
    <div className="fixed inset-0 z-0" aria-hidden>
      <Canvas
        dpr={[1, Q[tier].dpr]}
        gl={{ antialias: tier === 'high', alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 20, 900], fov: 50, near: 0.3, far: 12000 }}
        frameloop={visible ? 'always' : 'never'}
        fallback={<NoGL />}
        onCreated={({ gl }) => gl.setClearColor('#020205', 1)}
      >
        <World tier={tier} reduced={reduced} parallax={fine && !reduced} />
      </Canvas>
    </div>
  )
}
