import * as THREE from 'three'

const vert = /* glsl */ `
uniform float uVelocity;
uniform float uHover;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  // velocity bends the plane like paper in wind
  p.y += sin(uv.x * 3.14159) * uVelocity * 0.6;
  p.z += sin(uv.y * 3.14159) * uHover * 18.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`

const frag = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uVelocity;
uniform float uColor;
uniform vec2 uPlane;
uniform vec2 uImage;
uniform float uReveal;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  vec2 r = vec2(uPlane.x / uPlane.y, uImage.x / uImage.y);
  vec2 s = r.x < r.y ? vec2(r.x / r.y, 1.0) : vec2(1.0, r.y / r.x);
  return (uv - 0.5) * s + 0.5;
}

void main() {
  vec2 uv = vUv;
  // clip reveal, mirrors the DOM clip-path inset(12%·(1-r) 50%·(1-r))
  if (abs(vUv.x - 0.5) > 0.5 * uReveal || abs(vUv.y - 0.5) > 0.5 - 0.12 * (1.0 - uReveal)) discard;
  // liquid ripple around the cursor
  float d = distance(uv, uMouse);
  float ripple = sin(d * 28.0 - uTime * 5.0) * smoothstep(0.45, 0.0, d) * uHover;
  uv += normalize(uv - uMouse + 1e-4) * ripple * 0.025;
  // zoom on hover
  uv = (uv - 0.5) * (1.0 - uHover * 0.08) + 0.5;
  float shift = 0.004 + uHover * 0.012 + abs(uVelocity) * 0.0018;
  vec2 cuv = coverUv(uv);
  float r = texture2D(uTex, cuv + vec2(shift, 0.0)).r;
  float g = texture2D(uTex, cuv).g;
  float b = texture2D(uTex, cuv - vec2(shift, 0.0)).b;
  vec3 col = vec3(r, g, b);
  // duotone (ink ↔ bone) until hovered
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 duo = mix(vec3(0.043, 0.043, 0.051), vec3(0.925, 0.91, 0.875), l);
  col = mix(duo, col, uColor);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`

type Item = { el: HTMLElement; img: HTMLImageElement; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; hover: number; target: number; mouse: THREE.Vector2 }

/**
 * One renderer for all gallery images (effect: Hover Image Distortion + Shader Distortion).
 * Planes are positioned from DOM rects each frame in a pixel-space orthographic camera.
 */
export class DistortRenderer {
  renderer: THREE.WebGLRenderer
  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1000, 1000)
  items: Item[] = []
  velocity = 0
  private loader = new THREE.TextureLoader()
  private time = 0
  private host: HTMLElement

  constructor(canvas: HTMLCanvasElement, host: HTMLElement) {
    this.host = host
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.resize()
  }

  add(el: HTMLElement, img: HTMLImageElement) {
    const geo = new THREE.PlaneGeometry(1, 1, 24, 24)
    const mat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: {
        uTex: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uTime: { value: 0 },
        uVelocity: { value: 0 },
        uColor: { value: 0 },
        uPlane: { value: new THREE.Vector2(1, 1) },
        uImage: { value: new THREE.Vector2(1, 1) },
        uReveal: { value: 1 },
      },
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.visible = false
    this.scene.add(mesh)
    const item: Item = { el, img, mesh, hover: 0, target: 0, mouse: new THREE.Vector2(0.5, 0.5) }
    this.items.push(item)
    const src = img.currentSrc || img.src
    this.loader.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      mat.uniforms.uTex.value = tex
      mat.uniforms.uImage.value.set(tex.image.width, tex.image.height)
      mesh.visible = true
      el.classList.add('gl-ready')
    })
    const enter = () => (item.target = 1)
    const leave = () => (item.target = 0)
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      item.mouse.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height)
    }
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    el.addEventListener('pointermove', move)
    el.addEventListener('focusin', enter)
    el.addEventListener('focusout', leave)
    return () => {
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('focusin', enter)
      el.removeEventListener('focusout', leave)
    }
  }

  resize() {
    const { clientWidth: w, clientHeight: h } = this.host
    this.renderer.setSize(w, h, false)
    this.camera.left = 0
    this.camera.right = w
    this.camera.top = 0
    this.camera.bottom = h
    this.camera.updateProjectionMatrix()
  }

  render(dt: number) {
    this.time += dt
    const hostRect = this.host.getBoundingClientRect()
    const cx = window.innerWidth / 2
    for (const it of this.items) {
      const r = it.img.getBoundingClientRect()
      const m = it.mesh
      const visible = r.right > 0 && r.left < window.innerWidth && m.material.uniforms.uTex.value
      m.visible = !!visible
      if (!visible) continue
      it.hover += (it.target - it.hover) * Math.min(1, dt * 6)
      m.position.set(r.left - hostRect.left + r.width / 2, r.top - hostRect.top + r.height / 2, 0)
      m.scale.set(r.width, -r.height, 1)
      const u = m.material.uniforms
      u.uHover.value = it.hover
      u.uTime.value = this.time
      u.uVelocity.value = this.velocity
      u.uMouse.value.lerp(it.mouse, Math.min(1, dt * 8))
      u.uPlane.value.set(r.width, r.height)
      const rv = parseFloat(it.el.style.getPropertyValue('--reveal'))
      u.uReveal.value = Number.isNaN(rv) ? 1 : rv
      // colour returns near the centre of the screen or on hover
      const centre = 1 - Math.min(1, Math.abs(r.left + r.width / 2 - cx) / (window.innerWidth * 0.45))
      u.uColor.value = Math.max(it.hover, centre * centre)
    }
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.items.forEach((it) => {
      it.mesh.geometry.dispose()
      it.mesh.material.uniforms.uTex.value?.dispose()
      it.mesh.material.dispose()
      it.el.classList.remove('gl-ready')
    })
    this.renderer.dispose()
  }
}
