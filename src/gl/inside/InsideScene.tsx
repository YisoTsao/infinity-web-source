'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { insideState } from '@/stores/scroll'
import { pointer } from '@/motion/pointer'
import { useUI, selectReduced } from '@/stores/ui'

const SEG = { high: 256, mid: 192, low: 128 }

const NOISE = /* glsl */ `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=mod(i,289.0);vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
`

const vert = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uLiquid;
uniform vec3 uPoke;
uniform float uPokeAmt;
varying vec3 vPos;
varying vec3 vWorld;
${NOISE}

// sphere uv → flattened, half-twisted torus (a thick Möbius band)
vec3 mobiusBand(vec2 uv) {
  float U = uv.x * 6.2831853;
  float a = uv.y * 6.2831853;
  vec2 cs = vec2(cos(a) * 0.62, sin(a) * 0.14);        // flat elliptical section
  float tw = U * 0.5;                                    // half twist
  vec2 r = vec2(cs.x * cos(tw) - cs.y * sin(tw), cs.x * sin(tw) + cs.y * cos(tw));
  float R = 1.45 + r.x;
  return vec3(R * cos(U), R * sin(U), r.y);
}

// the full surface as a function of uv, so normals can be taken by finite differences
vec3 surface(vec2 uv) {
  float th = uv.x * 6.2831853, ph = uv.y * 3.14159265;
  vec3 sphere = vec3(-cos(th) * sin(ph), cos(ph), sin(th) * sin(ph)) * 1.45;
  vec3 p = mix(mobiusBand(uv), sphere, uMorph);
  float n = snoise(p * 1.25 + vec3(0.0, 0.0, uTime * 0.35));
  return p + normalize(p + 1e-4) * n * uLiquid;
}

varying vec3 vNormal2;

void main() {
  vec3 p = surface(uv);
  const float e = 0.0025;
  vec3 tu = surface(uv + vec2(e, 0.0)) - p;
  vec3 tv = surface(uv + vec2(0.0, e)) - p;
  vec3 nrm = normalize(cross(tu, tv) + 1e-6);
  // cursor "poke" dents the surface
  float d = distance((modelMatrix * vec4(p, 1.0)).xyz, uPoke);
  p -= nrm * smoothstep(1.1, 0.0, d) * uPokeAmt * 0.3;
  vPos = p;
  vNormal2 = normalize(mat3(modelMatrix) * nrm);
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`

const frag = /* glsl */ `
uniform vec3 uCamPos;
uniform vec3 uLightA;
uniform vec3 uColA;
uniform vec3 uLightB;
uniform vec3 uColB;
uniform vec3 uBase;
varying vec3 vPos;
varying vec3 vWorld;
varying vec3 vNormal2;
void main() {
  vec3 N = normalize(vNormal2);
  vec3 V = normalize(uCamPos - vWorld);
  if (dot(N, V) < 0.0) N = -N;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 La = normalize(uLightA - vWorld), Lb = normalize(uLightB - vWorld);
  float da = max(dot(N, La), 0.0), db = max(dot(N, Lb), 0.0);
  float sa = pow(max(dot(reflect(-La, N), V), 0.0), 48.0);
  float sb = pow(max(dot(reflect(-Lb, N), V), 0.0), 24.0);
  vec3 col = uBase * 0.08 + uBase * da * 0.55 + uColA * sa * 1.4 + uColB * (db * 0.35 + sb) + uColB * fres * 0.9;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`

function Liquid({ seg, animate }: { seg: number; animate: boolean }) {
  const mesh = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>>(null)
  const geometry = useMemo(() => new THREE.SphereGeometry(1, seg, seg / 2), [seg])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uLiquid: { value: 0.05 },
          uPoke: { value: new THREE.Vector3(99, 99, 99) },
          uPokeAmt: { value: 0 },
          uCamPos: { value: new THREE.Vector3() },
          uLightA: { value: new THREE.Vector3(3, 3, 4) },
          uColA: { value: new THREE.Color('#ffffff') },
          uLightB: { value: new THREE.Vector3(-4, -1, -2) },
          uColB: { value: new THREE.Color('#C8FF2E') },
          uBase: { value: new THREE.Color('#ECE8DF') },
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

  // camera rides a closed curve that dives through the ring
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 0.4, 9),
          new THREE.Vector3(3.2, 1.2, 4.2),
          new THREE.Vector3(1.6, 0.2, 0.9),
          new THREE.Vector3(-1.4, -0.4, 0.6),
          new THREE.Vector3(-3.8, 0.8, 3.6),
          new THREE.Vector3(-1.2, 2.6, 6.2),
          new THREE.Vector3(0, 0.4, 7.4),
        ],
        false,
        'centripetal',
      ),
    [],
  )
  const look = useMemo(() => new THREE.Vector3(), [])
  const ray = useMemo(() => new THREE.Raycaster(), [])
  const ndc = useMemo(() => new THREE.Vector2(), [])
  const sphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(), 1.6), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const colB = useMemo(() => [new THREE.Color('#C8FF2E'), new THREE.Color('#FF4A1C'), new THREE.Color('#8A6CFF')], [])

  useFrame((state, delta) => {
    if (!mesh.current) return
    const dt = Math.min(delta, 1 / 30)
    const u = mesh.current.material.uniforms
    const p = insideState.progress
    if (animate) u.uTime.value += dt
    u.uMorph.value = insideState.morph
    u.uLiquid.value = 0.04 + Math.sin(insideState.morph * Math.PI) * 0.38
    // camera path
    const cam = state.camera
    curve.getPointAt(Math.min(0.999, p), cam.position)
    look.set(Math.sin(p * 6.28) * 0.3, 0, 0)
    cam.lookAt(look)
    u.uCamPos.value.copy(cam.position)
    // dynamic lighting: orbiting key light, rim colour walks the palette
    const la = p * Math.PI * 4 + (animate ? u.uTime.value * 0.2 : 0)
    u.uLightA.value.set(Math.cos(la) * 4, 2.5, Math.sin(la) * 4)
    const L = insideState.light * 2
    const i = Math.min(1, Math.floor(L))
    u.uColB.value.copy(colB[i]).lerp(colB[i + 1], L - i)
    // poke
    ndc.set(pointer.nx, pointer.ny)
    ray.setFromCamera(ndc, cam)
    const on = animate && ray.ray.intersectSphere(sphere, hit)
    if (on) u.uPoke.value.lerp(hit, Math.min(1, dt * 8))
    u.uPokeAmt.value += ((on ? 1 : 0) - u.uPokeAmt.value) * Math.min(1, dt * 4)
    if (animate) mesh.current.rotation.z += dt * 0.1
  })

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />
}

export default function InsideScene() {
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
      <Canvas
        dpr={[1, tier === 'high' ? 2 : 1.5]}
        gl={{ alpha: true, antialias: tier === 'high', toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [0, 0.4, 9], fov: 40, near: 0.05, far: 50 }}
        frameloop={visible ? 'always' : 'never'}
      >
        <Liquid seg={SEG[tier]} animate={!reduced} />
      </Canvas>
    </div>
  )
}
