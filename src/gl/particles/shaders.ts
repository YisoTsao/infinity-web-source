// Ashima simplex noise 3D (MIT)
const SIMPLEX = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`

export const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uAssemble;
uniform float uPixelRatio;
uniform float uSize;
uniform float uMouseStrength;
uniform float uExit;
uniform vec3 uMouse;

attribute vec3 aScatter;
attribute vec4 aRand;
attribute vec2 aUv;

varying float vHeat;
varying float vAlpha;
varying float vEdge;
varying float vSeam;

${SIMPLEX}

float easeInOutCubic(float t){ return t < 0.5 ? 4.0*t*t*t : 1.0 - pow(-2.0*t + 2.0, 3.0) / 2.0; }

void main() {
  // staggered assembly: each particle has its own delay
  float delay = aRand.x * 0.5;
  float t = clamp((uAssemble - delay) / 0.5, 0.0, 1.0);
  t = easeInOutCubic(t);

  // swirl the scatter cloud on its way in, so particles arrive along a curve
  float swirl = (1.0 - t) * (2.2 + aRand.y * 2.0);
  float cs = cos(swirl), sn = sin(swirl);
  vec3 sc = vec3(aScatter.x * cs - aScatter.y * sn, aScatter.x * sn + aScatter.y * cs, aScatter.z);
  vec3 p = mix(sc, position, t);

  // living surface: flowing noise along the strip
  float n = snoise(vec3(aUv.x * 6.0, aUv.y * 1.5, uTime * 0.22 + aRand.z));
  p += vec3(0.0, 0.0, n * 0.07) + normalize(p + 1e-4) * n * 0.035;

  vec4 world = modelMatrix * vec4(p, 1.0);

  // cursor force field — pushes particles away in screen-aligned plane
  vec3 d = world.xyz - uMouse;
  float dist = length(d.xy);
  float f = smoothstep(0.95, 0.0, dist) * uMouseStrength * t;
  world.xy += normalize(d.xy + 1e-4) * f * (0.35 + aRand.z * 0.45);
  world.z += f * (aRand.w - 0.3) * 0.8;
  vHeat = f;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float size = uSize * (0.35 + aRand.w * 0.9) * (1.0 + f * 1.2);
  gl_PointSize = min(size * uPixelRatio * (1.0 / -mv.z), 48.0 * uPixelRatio);

  // depth cue + fade near camera on exit
  float depth = smoothstep(12.0, 3.5, -mv.z);
  float near = smoothstep(0.25, 1.4, -mv.z);
  vAlpha = mix(0.18, 1.0, t) * mix(0.35, 1.0, depth) * near * (1.0 - uExit * 0.6);
  vEdge = step(0.94, abs(aUv.y));
  // the half twist: brightest where the strip turns over
  vSeam = pow(abs(sin(aUv.x * 3.14159265)), 6.0);
}
`

export const fragmentShader = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uOpacity;

varying float vHeat;
varying float vAlpha;
varying float vEdge;
varying float vSeam;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.05, d);
  vec3 col = mix(uColorA, uColorB, smoothstep(0.04, 0.55, vHeat));
  float alpha = a * vAlpha * uOpacity * (0.55 + vEdge * 0.45);
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
`
