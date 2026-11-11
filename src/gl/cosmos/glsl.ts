/** Shared GLSL chunks for ORBIT ∞. Simplex noise: Ashima Arts / Stefan Gustavson (MIT). */
export const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float a=0.5,s=0.0;
  for(int i=0;i<5;i++){s+=a*snoise(p);p*=2.03;a*=0.5;}
  return s;
}
float fbm3(vec3 p){
  float a=0.5,s=0.0;
  for(int i=0;i<3;i++){s+=a*snoise(p);p*=2.07;a*=0.5;}
  return s;
}
`

export const PLANET_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vN;
varying vec3 vWorld;
void main(){
  vObj=normalize(position);
  vN=normalize(mat3(modelMatrix)*normal);
  vec4 w=modelMatrix*vec4(position,1.0);
  vWorld=w.xyz;
  gl_Position=projectionMatrix*viewMatrix*w;
}
`

/** One shader, five surface recipes (uKind): 0 star · 1 rocky · 2 venus · 3 earth · 4 gas · 5 ice */
export const PLANET_FRAG = /* glsl */ `
uniform int uKind;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform vec3 uSun; uniform float uTime; uniform float uSeed;
uniform vec3 uAtmo; uniform float uAtmoK;
uniform vec4 uSpot;   // xyz: spot direction (object space), w: size (0 = none)
uniform vec3 uSpotCol;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld;
${NOISE}
void main(){
  vec3 p=vObj;
  vec3 N=normalize(vN);
  vec3 L=normalize(uSun-vWorld);
  vec3 V=normalize(cameraPosition-vWorld);
  float ndv=max(dot(N,V),0.0);

  if(uKind==0){
    float g=fbm(p*5.0+vec3(0.0,uTime*0.04,uSeed));
    float c=fbm(p*14.0-vec3(uTime*0.06));
    vec3 col=mix(uA,uB,smoothstep(-0.4,0.5,g));
    col=mix(col,uC,smoothstep(0.1,0.7,c)*0.55);
    col*=mix(0.75,1.35,pow(ndv,0.6));
    col+=uC*pow(ndv,6.0)*0.35;
    gl_FragColor=vec4(col,1.0);
    #include <colorspace_fragment>
    return;
  }

  vec3 col=uB;
  float spec=0.0;
  float night=0.0;
  if(uKind==1){
    float n=fbm(p*2.4+uSeed);
    float d=fbm(p*8.0+uSeed*2.0);
    col=mix(uA,uB,smoothstep(-0.45,0.45,n));
    col=mix(col,uC,smoothstep(0.25,0.75,d)*0.55);
    float cr=1.0-smoothstep(0.0,0.08,abs(snoise(p*11.0+uSeed)));
    col*=1.0-cr*0.22;
  } else if(uKind==2){
    vec3 q=p*2.0+vec3(0.0,0.0,uTime*0.015);
    float w=fbm(q+fbm(q*1.6)*0.9);
    float band=sin((p.y+w*0.35)*9.0)*0.5+0.5;
    col=mix(uA,uB,smoothstep(-0.5,0.6,w));
    col=mix(col,uC,band*0.45);
  } else if(uKind==3){
    float h=fbm(p*2.1+uSeed)+0.12*fbm(p*9.0);
    float land=smoothstep(0.04,0.09,h);
    vec3 ocean=mix(uA*0.7,uA*1.25,smoothstep(-0.6,0.04,h));
    float dry=smoothstep(-0.1,0.35,fbm(p*3.4+7.0));
    vec3 ground=mix(uB,uC,dry*0.75);
    col=mix(ocean,ground,land);
    float ice=smoothstep(0.78,0.86,abs(p.y)+fbm(p*6.0)*0.08);
    col=mix(col,vec3(0.93),ice);
    vec3 cq=p*2.6+vec3(uTime*0.006,0.0,0.0);
    float cloud=smoothstep(0.05,0.55,fbm(cq+fbm(cq*2.0)*0.6));
    col=mix(col,vec3(0.96),cloud*0.85);
    spec=(1.0-land)*(1.0-cloud)*(1.0-ice);
    float city=smoothstep(0.55,0.85,snoise(p*48.0))*smoothstep(0.3,0.6,snoise(p*9.0)*0.5+0.5);
    night=land*(1.0-ice)*(1.0-cloud*0.8)*city;
  } else if(uKind==4){
    float warp=fbm(p*vec3(2.2,7.0,2.2)+uSeed+vec3(uTime*0.01,0.0,0.0))*0.32;
    float lat=p.y+warp;
    float b1=sin(lat*13.0)*0.5+0.5;
    float b2=sin(lat*31.0+1.3)*0.5+0.5;
    col=mix(uA,uB,b1);
    col=mix(col,uC,smoothstep(0.55,1.0,b2)*0.6);
    col*=0.9+0.2*fbm(p*vec3(6.0,24.0,6.0));
  } else {
    float w=fbm(p*vec3(2.0,6.0,2.0)+uSeed)*0.15;
    float band=sin((p.y+w)*8.0)*0.5+0.5;
    col=mix(uB,uC,smoothstep(-0.9,1.0,p.y+w));
    col=mix(col,uA,band*0.25);
  }

  // storm spots (Jupiter's Great Red Spot, Neptune's Dark Spot, Pluto's heart)
  if(uSpot.w>0.0){
    vec3 s=normalize(uSpot.xyz);
    vec3 t=normalize(cross(vec3(0.0,1.0,0.0),s));
    vec3 bt=cross(s,t);
    vec2 e=vec2(dot(p-s,t)/(uSpot.w*1.7),dot(p-s,bt)/uSpot.w);
    float d=length(e)+snoise(p*9.0)*0.12;
    float m=(1.0-smoothstep(0.55,1.0,d))*step(0.0,dot(p,s));
    float swirl=sin(atan(e.y,e.x)*3.0+d*14.0-uTime*0.4)*0.5+0.5;
    col=mix(col,uSpotCol*(0.85+0.3*swirl),m);
  }

  float ndl=dot(N,L);
  float lit=smoothstep(-0.12,0.5,ndl);
  vec3 c=col*(0.018+lit*1.15);
  if(spec>0.0){
    vec3 H=normalize(L+V);
    c+=vec3(1.0,0.95,0.85)*pow(max(dot(N,H),0.0),60.0)*spec*lit*0.9;
  }
  c+=vec3(1.0,0.72,0.38)*night*(1.0-smoothstep(-0.25,0.05,ndl))*1.4;
  float fres=pow(1.0-ndv,3.0);
  c+=uAtmo*fres*uAtmoK*smoothstep(-0.35,0.6,ndl);
  gl_FragColor=vec4(c,1.0);
  #include <colorspace_fragment>
}
`

/** Atmospheric halo shell: glow peaks at the planet's limb, fades to the shell edge, lit side only. */
export const HALO_FRAG = /* glsl */ `
uniform vec3 uCenter; uniform float uR; uniform float uShell;
uniform vec3 uSun; uniform vec3 uAtmo; uniform float uK;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld;
void main(){
  vec3 rd=normalize(vWorld-cameraPosition);
  vec3 oc=uCenter-cameraPosition;
  float tca=dot(oc,rd);
  float d=length(oc-rd*tca);
  float g=1.0-smoothstep(uR,uShell,d);
  g=pow(g,2.2);
  vec3 closest=normalize(cameraPosition+rd*tca-uCenter);
  float lit=smoothstep(-0.45,0.55,dot(closest,normalize(uSun-uCenter)));
  gl_FragColor=vec4(uAtmo*g*lit*uK,1.0);
  #include <colorspace_fragment>
}
`

export const RING_VERT = /* glsl */ `
varying vec2 vLocal;
varying vec3 vWorld;
void main(){
  vLocal=position.xy;
  vec4 w=modelMatrix*vec4(position,1.0);
  vWorld=w.xyz;
  gl_Position=projectionMatrix*viewMatrix*w;
}
`

export const RING_FRAG = /* glsl */ `
uniform float uInner; uniform float uOuter; uniform float uR;
uniform vec3 uTint; uniform float uOpacity; uniform float uSeed;
uniform vec3 uCenter; uniform vec3 uSun;
varying vec2 vLocal; varying vec3 vWorld;
${NOISE}
void main(){
  float r=length(vLocal)/uR;
  float t=(r-uInner)/(uOuter-uInner);
  if(t<0.0||t>1.0) discard;
  float n=snoise(vec3(r*38.0,uSeed,0.0))*0.5+0.5;
  float n2=snoise(vec3(r*140.0,uSeed+3.0,0.0))*0.5+0.5;
  float dens=mix(0.35,1.0,n)*mix(0.7,1.0,n2);
  dens*=smoothstep(0.0,0.06,t)*smoothstep(1.0,0.9,t);
  dens*=smoothstep(0.0,0.025,abs(t-0.63));
  dens*=mix(1.0,0.45,smoothstep(0.7,0.95,t));
  // planet shadow: does the ray toward the Sun hit the planet?
  vec3 L=normalize(uSun-vWorld);
  vec3 oc=uCenter-vWorld;
  float tca=dot(oc,L);
  float d2=dot(oc,oc)-tca*tca;
  float shadow=(tca>0.0&&d2<uR*uR*0.98)?0.12:1.0;
  vec3 col=uTint*(0.55+0.6*n2)*shadow;
  gl_FragColor=vec4(col,dens*uOpacity);
  #include <colorspace_fragment>
}
`

export const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime; uniform float uDpr; uniform float uTwinkle;
varying vec3 vColor; varying float vA;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.0);
  gl_Position=projectionMatrix*mv;
  float tw=1.0-uTwinkle*0.45*(0.5+0.5*sin(uTime*(1.2+aPhase*2.6)+aPhase*40.0));
  gl_PointSize=aSize*uDpr*(0.8+0.4*tw);
  vColor=aColor; vA=tw;
}
`

export const STAR_FRAG = /* glsl */ `
varying vec3 vColor; varying float vA;
void main(){
  vec2 c=gl_PointCoord-0.5;
  float d=length(c);
  float a=smoothstep(0.5,0.0,d);
  a=a*a;
  gl_FragColor=vec4(vColor*a*vA,1.0);
}
`

export const NEBULA_FRAG = /* glsl */ `
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld;
uniform float uTime;
${NOISE}
void main(){
  vec3 d=normalize(vObj);
  float n=fbm(d*1.6+vec3(0.0,0.0,uTime*0.002));
  float m=fbm(d*3.2+n*0.9+11.0);
  float band=exp(-pow((d.y+n*0.25)*3.2,2.0));
  vec3 violet=vec3(0.16,0.06,0.28);
  vec3 teal=vec3(0.03,0.16,0.22);
  vec3 rose=vec3(0.32,0.07,0.12);
  vec3 col=mix(violet,teal,smoothstep(-0.3,0.4,n));
  col=mix(col,rose,smoothstep(0.25,0.7,m)*0.6);
  float k=band*smoothstep(-0.2,0.6,m)*0.55+smoothstep(0.35,0.9,n)*0.18;
  gl_FragColor=vec4(col*k,1.0);
}
`

/** World-space wrapped dust: infinite parallax field around the camera; lines = velocity streaks. */
export const DUST_VERT = /* glsl */ `
attribute float aEnd;
uniform vec3 uCam; uniform vec3 uWrap; uniform float uS; uniform vec3 uVel; uniform float uDpr; uniform float uSize;
varying float vA;
void main(){
  vec3 rel=mod(position-uWrap+uS*0.5,uS)-uS*0.5;
  vec3 wp=uCam+rel;
  wp+=uVel*aEnd;
  float dist=length(rel);
  vA=smoothstep(uS*0.5,uS*0.18,dist)*smoothstep(0.5,4.0,dist);
  vec4 mv=viewMatrix*vec4(wp,1.0);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uSize*uDpr*clamp(30.0/-mv.z,0.6,3.0);
}
`

export const DUST_POINT_FRAG = /* glsl */ `
uniform float uAlpha;
varying float vA;
void main(){
  float d=length(gl_PointCoord-0.5);
  float a=smoothstep(0.5,0.1,d);
  gl_FragColor=vec4(vec3(0.85,0.88,1.0)*a*vA*uAlpha,1.0);
}
`

export const DUST_LINE_FRAG = /* glsl */ `
uniform float uAlpha;
varying float vA;
void main(){
  gl_FragColor=vec4(vec3(0.8,0.9,1.0)*vA*uAlpha,1.0);
}
`

export const METEOR_VERT = /* glsl */ `
uniform vec3 uHead; uniform vec3 uDir; uniform float uLen; uniform float uWidth;
varying vec2 vUv;
void main(){
  vUv=uv;
  float u=uv.x; float s=uv.y*2.0-1.0;
  vec3 p=uHead-uDir*uLen*(1.0-u);
  vec3 side=normalize(cross(uDir,normalize(cameraPosition-p)));
  p+=side*s*uWidth*(0.12+0.88*u*u);
  gl_Position=projectionMatrix*viewMatrix*vec4(p,1.0);
}
`

export const METEOR_FRAG = /* glsl */ `
uniform float uLife; uniform vec3 uColor;
varying vec2 vUv;
void main(){
  float u=vUv.x; float s=abs(vUv.y*2.0-1.0);
  float core=pow(u,2.2)*pow(1.0-s,1.6);
  float head=smoothstep(0.86,1.0,u)*(1.0-s);
  vec3 col=mix(uColor,vec3(1.0),head);
  gl_FragColor=vec4(col*(core+head*1.5)*uLife,1.0);
}
`
