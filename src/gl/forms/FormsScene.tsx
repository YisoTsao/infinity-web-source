'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { buildShapes } from './shapes'
import { formsState } from '@/stores/scroll'
import { pointer } from '@/motion/pointer'
import { useUI, selectReduced } from '@/stores/ui'

const COUNTS = { high: 36000, mid: 20000, low: 9000 }

const vert = /* glsl */ `
uniform float uShape;
uniform float uTime;
uniform float uPixelRatio;
uniform float uSize;
attribute vec3 aSphere;
attribute vec3 aKnot;
attribute vec3 aLem;
attribute vec4 aRand;
varying float vAlpha;
varying float vMix;

vec3 shapeAt(float i) {
  if (i < 0.5) return position;
  if (i < 1.5) return aSphere;
  if (i < 2.5) return aKnot;
  return aLem;
}

void main() {
  float idx = floor(uShape);
  float f = uShape - idx;
  // per-particle delay → the form "pours" from one shape to the next
  float delay = aRand.x * 0.45;
  float t = smoothstep(delay, delay + 0.55, f);
  vec3 a = shapeAt(idx);
  vec3 b = shapeAt(min(idx + 1.0, 3.0));
  vec3 p = mix(a, b, t);
  // liquid turbulence peaks mid-transition
  float swirl = sin(t * 3.14159);
  float ang = swirl * (aRand.y - 0.5) * 3.0;
  p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
  p += vec3(sin(uTime * 0.7 + aRand.z * 6.28), cos(uTime * 0.6 + aRand.w * 6.28), sin(uTime * 0.5 + aRand.x * 6.28)) * (0.015 + swirl * 0.35);
  vMix = swirl;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.4 + aRand.w * 0.8) * uPixelRatio / -mv.z;
  vAlpha = smoothstep(12.0, 3.0, -mv.z);
}
`
const frag = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uHot;
varying float vAlpha;
varying float vMix;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vAlpha * 0.6;
  if (a < 0.004) discard;
  gl_FragColor = vec4(mix(uColor, uHot, vMix), a);
  #include <colorspace_fragment>
}
`

const COLORS = ['#ECE8DF', '#C8FF2E', '#FF4A1C', '#ECE8DF'].map((c) => new THREE.Color(c))

function Forms({ count, animate }: { count: number; animate: boolean }) {
  const group = useRef<THREE.Group>(null)
  const pts = useRef<THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>>(null)
  const geometry = useMemo(() => {
    const s = buildShapes(count)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(s.strip, 3))
    g.setAttribute('aSphere', new THREE.BufferAttribute(s.sphere, 3))
    g.setAttribute('aKnot', new THREE.BufferAttribute(s.knot, 3))
    g.setAttribute('aLem', new THREE.BufferAttribute(s.lem, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(s.rand, 4))
    return g
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uShape: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uSize: { value: 24 },
          uColor: { value: new THREE.Color('#ECE8DF') },
          uHot: { value: new THREE.Color('#C8FF2E') },
        },
      }),
    [],
  )
  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])
  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame((state, delta) => {
    if (!pts.current || !group.current) return
    const dt = Math.min(delta, 1 / 30)
    const u = pts.current.material.uniforms
    u.uShape.value = formsState.shape
    u.uPixelRatio.value = state.gl.getPixelRatio()
    if (animate) u.uTime.value += dt
    const i = Math.min(2, Math.floor(formsState.shape))
    tmp.copy(COLORS[i]).lerp(COLORS[i + 1], formsState.shape - i)
    u.uColor.value.copy(tmp)
    // continuous 3D rotation + scroll-added spin + mouse tilt
    if (animate) group.current.rotation.y += dt * 0.28
    group.current.rotation.z = formsState.spin
    const tx = 0.35 + (animate ? pointer.ny * 0.25 : 0)
    group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, dt * 3)
    const fit = THREE.MathUtils.clamp(state.size.width / state.size.height / 1.2, 0.5, 1)
    group.current.scale.setScalar(fit)
  })

  return (
    <group ref={group}>
      <points ref={pts} geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}

export default function FormsScene() {
  const tier = useUI((s) => s.tier)
  const reduced = useUI(selectReduced)
  const wrap = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    if (wrap.current) io.observe(wrap.current)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden>
      <Canvas dpr={[1, tier === 'high' ? 2 : 1.5]} gl={{ alpha: true, antialias: false }} camera={{ position: [0, 0, 6.2], fov: 38 }} frameloop={visible ? 'always' : 'never'}>
        <Forms count={COUNTS[tier]} animate={!reduced} />
      </Canvas>
    </div>
  )
}
