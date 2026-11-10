'use client'
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildMobiusParticles } from '@/gl/geometry/mobius'
import { vertexShader, fragmentShader } from './shaders'
import { heroState } from '@/stores/scroll'
import { pointer } from '@/motion/pointer'
import { palette } from '@/motion/config'

type Props = { count: number; size: number; animate: boolean }

const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
const ray = new THREE.Raycaster()
const ndc = new THREE.Vector2()
const hit = new THREE.Vector3()

/**
 * Particle Möbius strip (effect ⑦). All motion lives in the vertex shader;
 * the CPU only updates a handful of uniforms per frame.
 */
export function ParticleMobius({ count, size, animate }: Props) {
  const tilt = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const points = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)

  const geometry = useMemo(() => {
    const b = buildMobiusParticles(count)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(b.position, 3))
    g.setAttribute('aScatter', new THREE.BufferAttribute(b.scatter, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(b.rand, 4))
    g.setAttribute('aUv', new THREE.BufferAttribute(b.uv, 2))
    g.computeBoundingSphere()
    g.boundingSphere!.radius = 12 // scatter cloud + mouse push: never frustum-cull
    return g
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uAssemble: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: size },
          uMouseStrength: { value: 0 },
          uExit: { value: 0 },
          uOpacity: { value: 1 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uColorA: { value: new THREE.Color(palette.bone) },
          uColorB: { value: new THREE.Color(palette.signal) },
        },
      }),
    [size],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((state, delta) => {
    if (!points.current) return
    const { camera, size: canvas, gl } = state
    const dt = Math.min(delta, 1 / 30)
    const u = points.current.material.uniforms
    u.uPixelRatio.value = gl.getPixelRatio()
    u.uAssemble.value = heroState.assemble
    u.uExit.value = heroState.exit
    if (animate) u.uTime.value += dt

    // responsive fit: shrink on narrow / portrait viewports
    const aspect = canvas.width / canvas.height
    const fit = THREE.MathUtils.clamp(aspect / 1.35, 0.42, 1) * 0.8
    const e = heroState.exit
    const scale = fit * (1 + e * 1.15)
    // smaller strip on narrow screens → smaller points, so density reads the same
    u.uSize.value = size * Math.max(0.6, fit / 0.8)

    if (tilt.current && spin.current) {
      tilt.current.scale.setScalar(scale)
      const tx = -0.62 + pointer.ny * 0.14 * (animate ? 1 : 0) + e * 0.5
      const ty = pointer.nx * 0.22 * (animate ? 1 : 0)
      tilt.current.rotation.x += (tx - tilt.current.rotation.x) * Math.min(1, dt * 3)
      tilt.current.rotation.y += (ty - tilt.current.rotation.y) * Math.min(1, dt * 3)
      if (animate) spin.current.rotation.z += dt * (0.11 + e * 0.5)
    }
    camera.position.z = 6 - e * 2.6

    // cursor → world point on z=0 plane
    const active = animate && performance.now() - pointer.lastMove < (pointer.type === 'mouse' ? 2500 : 900)
    if (active) {
      ndc.set(pointer.nx, pointer.ny)
      ray.setFromCamera(ndc, camera)
      if (ray.ray.intersectPlane(plane, hit)) u.uMouse.value.lerp(hit, Math.min(1, dt * 10))
    }
    const target = active ? 1 : 0
    u.uMouseStrength.value += (target - u.uMouseStrength.value) * Math.min(1, dt * 4)
  })

  return (
    <group ref={tilt}>
      <group ref={spin}>
        <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
      </group>
    </group>
  )
}
