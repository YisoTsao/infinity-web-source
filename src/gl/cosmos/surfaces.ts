import { NOISE } from './glsl'

/**
 * Realistic surfaces for ORBIT ∞ (v2).
 * - bump mapping from a procedural height field (Mikkelsen's surface-gradient method, no tangents needed)
 * - Worley craters with bowl / rim / ejecta, Lommel–Seeliger regolith lighting for airless bodies
 * - Earth: biomes, mountains, coastal city lights, ocean glint, cloud shadows (clouds are their own layer)
 * - gas giants: differential rotation, turbulent band edges, limb darkening, ring shadows
 */

export const BODY_ID = {
  sun: 0, mercury: 1, venus: 2, earth: 3, moon: 4, mars: 5, jupiter: 6, saturn: 7, uranus: 8, neptune: 9, pluto: 10,
} as const

const COMMON = /* glsl */ `
${NOISE}
vec3 hash33(vec3 p){
  p=fract(p*vec3(0.1031,0.1030,0.0973));
  p+=dot(p,p.yxz+33.33);
  return fract((p.xxy+p.yxx)*p.zyx);
}
vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}

// one octave of craters: returns height; rim = rim mask, fl = floor mask
float craterLayer(vec3 p,float scale,float density,float seed,inout float rim,inout float fl){
  vec3 c=p*scale; vec3 ic=floor(c); vec3 fc=fract(c);
  float h=0.0;
  for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++)for(int z=-1;z<=1;z++){
    vec3 g=vec3(float(x),float(y),float(z));
    vec3 r=hash33(ic+g+seed);
    if(r.z>density) continue;
    vec3 o=g+0.15+r*0.7-fc;
    float rad=0.22+0.42*fract(r.x*13.7+r.y*7.3);
    float d=length(o)/rad;
    if(d<1.8){
      float bowl=d<1.0?max(d*d-1.0,-0.7):0.0;
      float rm=exp(-pow((d-1.0)/0.16,2.0));
      float ej=d>1.0?exp(-(d-1.0)*3.5)*0.08:0.0;
      h+=(bowl+rm*0.32+ej)*rad;
      rim=max(rim,rm);
      fl=max(fl,1.0-smoothstep(0.55,0.85,d));
    }
  }
  return h;
}

// Mikkelsen 2010: perturb a world normal by the screen-space gradient of a scalar height
vec3 bump(vec3 N,vec3 pos,float h,float k){
  vec3 dpdx=dFdx(pos); vec3 dpdy=dFdy(pos);
  float dhdx=dFdx(h); float dhdy=dFdy(h);
  vec3 r1=cross(dpdy,N); vec3 r2=cross(N,dpdx);
  float det=dot(dpdx,r1);
  vec3 grad=sign(det)*(dhdx*r1+dhdy*r2);
  return normalize(abs(det)*N-k*grad);
}

// Earth clouds — shared by the surface (for shadows) and the cloud layer
float cloudAt(vec3 p,float t){
  vec3 q=rotY(p,t*0.006)*2.4;
  float base=fbm(q+fbm(q*1.7+3.0)*0.7);
  float lat=abs(p.y);
  // storm belts mid-latitudes, clearer subtropics
  float belt=0.55+0.45*smoothstep(0.25,0.55,lat)-0.25*smoothstep(0.1,0.3,lat)*(1.0-smoothstep(0.3,0.45,lat));
  float c=smoothstep(0.1,0.55,base*belt+0.05);
  float wisp=smoothstep(0.35,0.7,fbm3(q*4.5+11.0));
  return clamp(c*0.9+wisp*0.25*c,0.0,1.0);
}
`

export const SURFACE_VERT = /* glsl */ `
uniform vec3 uSun;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld; varying vec3 vLobj;
void main(){
  vObj=normalize(position);
  vN=normalize(mat3(modelMatrix)*normal);
  vec4 w=modelMatrix*vec4(position,1.0);
  vWorld=w.xyz;
  vLobj=normalize((inverse(modelMatrix)*vec4(uSun,1.0)).xyz-position);
  gl_Position=projectionMatrix*viewMatrix*w;
}
`

export const SURFACE_FRAG = /* glsl */ `
uniform int uId;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC;
uniform vec3 uSun; uniform float uTime; uniform float uSeed; uniform float uR;
uniform vec3 uAtmo; uniform float uAtmoK;
uniform vec4 uSpot; uniform vec3 uSpotCol;
uniform vec3 uCenter; uniform vec3 uRingN; uniform vec2 uRing;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld; varying vec3 vLobj;
${COMMON}

float ringDensity(float r){
  float t=(r-uRing.x)/(uRing.y-uRing.x);
  if(t<0.0||t>1.0) return 0.0;
  float n=snoise(vec3(r/uR*38.0,uSeed,0.0))*0.5+0.5;
  return mix(0.35,1.0,n)*smoothstep(0.0,0.025,abs(t-0.63))*mix(1.0,0.45,smoothstep(0.7,0.95,t));
}

void main(){
  vec3 p=vObj;
  vec3 Ng=normalize(vN);
  vec3 L=normalize(uSun-vWorld);
  vec3 V=normalize(cameraPosition-vWorld);
  float ndlG=dot(Ng,L);

  vec3 col=uB;
  float h=0.0;        // height for bump mapping
  float bumpK=0.0;
  float regolith=0.0; // 1 = airless body lighting
  float spec=0.0; float night=0.0; float cshadow=0.0; float wrap=0.0;

  if(uId==1||uId==4||uId==10){
    // ── airless: Mercury, Moon, Pluto ───────────────────────────────
    float rim=0.0, fl=0.0;
    float sd=uSeed*17.0;
    float maria=uId==4?smoothstep(0.05,0.35,fbm(p*1.3+sd)):0.0;
    float dens=uId==10?0.2:(uId==4?0.62-maria*0.35:0.7);
    h+=craterLayer(p,3.2,dens*0.7,sd,rim,fl)*1.2;
    h+=craterLayer(p,7.5,dens,sd+3.0,rim,fl)*0.55;
    h+=craterLayer(p,17.0,dens,sd+7.0,rim,fl)*0.26;
    h+=craterLayer(p,36.0,dens,sd+9.0,rim,fl)*0.12;
    h+=fbm(p*9.0+sd)*0.04;
    float tone=fbm(p*4.0+sd)*0.5+0.5;
    col=mix(uB,uC,smoothstep(0.3,0.8,tone));
    col=mix(col,uA,maria*0.85);
    col=mix(col,uC*1.08,rim*0.35);
    col*=1.0-fl*0.08;
    bumpK=uR*(uId==10?0.035:0.06);
    regolith=1.0;
    if(uId==10){
      // Pluto: bright nitrogen-ice heart, dark reddish equatorial belt, cellular plains
      float belt=smoothstep(0.35,0.0,abs(p.y+0.05+fbm(p*3.0)*0.1));
      col=mix(col,vec3(0.32,0.16,0.09),belt*0.75);
      if(uSpot.w>0.0){
        vec3 s=normalize(uSpot.xyz);
        float d=distance(p,s)+fbm(p*5.0)*0.12;
        float heart=1.0-smoothstep(uSpot.w*0.7,uSpot.w,d);
        vec3 cell=hash33(floor(p*26.0));
        col=mix(col,uSpotCol*(0.93+0.07*cell.x),heart);
        h*=1.0-heart*0.9;
      }
    }
  } else if(uId==5){
    // ── Mars: dust, dark basalt, canyons, caps, a few craters ──────────
    float rim=0.0, fl=0.0;
    h+=craterLayer(p,6.0,0.18,uSeed,rim,fl)*0.5;
    h+=craterLayer(p,15.0,0.25,uSeed+4.0,rim,fl)*0.2;
    float can=0.0;
    h+=fbm(p*6.0+uSeed)*0.08;
    float dark=smoothstep(0.1,0.45,fbm(p*1.8+uSeed*2.0));
    col=mix(uB,uC,smoothstep(-0.3,0.6,fbm(p*5.0)));
    col=mix(col,uA*0.8,dark*0.65);
    col=mix(col,uA,can*0.6);
    float cap=smoothstep(0.84,0.9,abs(p.y)+fbm(p*8.0)*0.05);
    col=mix(col,vec3(0.95,0.93,0.9),cap);
    bumpK=uR*0.05;
    wrap=0.05;
  } else if(uId==2){
    // ── Venus: sulphuric cloud deck, Y-shaped streaks ────────────────
    vec3 q=rotY(p,uTime*0.01);
    vec3 s=q*vec3(2.0,5.0,2.0);
    float w=fbm(s+fbm(s*1.5+uTime*0.02)*1.2);
    float y=sin((q.y+w*0.18)*7.0+q.x*1.5)*0.5+0.5;
    col=mix(uA,uB,smoothstep(-0.6,0.5,w));
    col=mix(col,uC,y*0.5);
    col*=0.85+0.25*fbm(q*12.0);
    wrap=0.35;
  } else if(uId==3){
    // ── Earth ─────────────────────────────────────────────────────────
    float hgt=fbm(p*2.1+uSeed)+0.12*fbm(p*9.0);
    float land=smoothstep(0.04,0.065,hgt);
    float ridge=pow(1.0-abs(snoise(p*13.0+2.0)),3.0);
    float mtn=land*ridge*smoothstep(0.08,0.35,hgt);
    h=smoothstep(0.0,0.45,hgt)*0.35+mtn*0.35;
    float lat=abs(p.y);
    float shallow=smoothstep(-0.12,0.05,hgt)*(1.0-land);
    vec3 ocean=mix(vec3(0.005,0.03,0.09),vec3(0.02,0.18,0.28),shallow);
    float arid=smoothstep(0.12,0.42,fbm(p*3.0+7.0)+0.35-abs(lat-0.38)*1.6);
    vec3 green=mix(vec3(0.05,0.16,0.05),vec3(0.13,0.24,0.09),fbm(p*7.0)*0.5+0.5);
    vec3 desert=mix(vec3(0.55,0.42,0.25),vec3(0.75,0.62,0.42),fbm(p*9.0)*0.5+0.5);
    vec3 tundra=vec3(0.32,0.3,0.26);
    vec3 ground=mix(green,desert,arid);
    ground=mix(ground,tundra,smoothstep(0.55,0.72,lat));
    ground=mix(ground,vec3(0.42,0.38,0.34),mtn*0.6);
    col=mix(ocean,ground,land);
    float ice=smoothstep(0.8,0.86,lat+fbm(p*6.0)*0.06);
    col=mix(col,vec3(0.92,0.95,1.0),ice);
    spec=(1.0-land)*(1.0-ice);
    // city lights: clustered, hugging coastlines and lowlands
    float coast=land*(1.0-smoothstep(0.0,0.12,hgt-0.065));
    float cluster=smoothstep(0.0,0.6,fbm(p*5.0+31.0));
    float pts=pow(max(snoise(p*140.0),0.0),2.0)*1.6+pow(max(snoise(p*60.0),0.0),3.0)*1.2;
    float sprawl=smoothstep(0.25,0.9,fbm(p*22.0+5.0));
    night=land*(1.0-ice)*(1.0-mtn)*(1.0-arid*0.6)*(cluster*0.7+coast*1.1)*(pts+sprawl*0.35);
    // cloud shadow: sample the cloud field slightly toward the Sun
    cshadow=cloudAt(normalize(p+normalize(vLobj)*0.025),uTime);
    bumpK=0.0;
  } else if(uId==6||uId==7){
    // ── gas giants: differential rotation, turbulent belts ───────────
    float lat=p.y;
    float drift=uTime*0.035*(sin(lat*21.0)*0.6+sin(lat*8.0)*0.4);
    vec3 q=rotY(p,drift);
    float turb=fbm(q*vec3(3.0,7.0,3.0)+uSeed);
    float wl=lat+turb*0.035+fbm(q*vec3(5.0,40.0,5.0))*0.012;
    float f=uId==6?17.0:13.0;
    float b1=sin(wl*f)*0.5+0.5;
    float b2=sin(wl*f*2.3+1.3)*0.5+0.5;
    float b3=sin(wl*f*5.1+0.4)*0.5+0.5;
    col=mix(uA,uC,smoothstep(0.25,0.75,b1));
    col=mix(col,uB,b2*0.45);
    col*=0.88+0.18*b3;
    // eddies chewing the band edges
    float edge=1.0-abs(cos(wl*f));
    float eddy=fbm(q*vec3(9.0,22.0,9.0)+turb*2.0+uTime*0.01);
    col=mix(col,uC*1.05,smoothstep(0.15,0.7,eddy)*edge*(uId==6?0.5:0.25));
    col=mix(col,uA*0.85,smoothstep(0.2,0.8,-eddy)*edge*(uId==6?0.35:0.15));
    if(uId==7) col=mix(col,uC,0.25);
    wrap=0.12;
  } else {
    // ── ice giants ───────────────────────────────────────────────────
    float lat=p.y;
    vec3 q=rotY(p,uTime*0.02*sin(lat*6.0));
    float w=fbm(q*vec3(2.0,8.0,2.0)+uSeed)*0.08;
    float band=sin((lat+w)*(uId==9?14.0:7.0))*0.5+0.5;
    col=mix(uB,uC,smoothstep(-1.0,1.0,lat*0.6+w));
    col=mix(col,uA,band*(uId==9?0.3:0.12));
    if(uId==9){
      float cirrus=smoothstep(0.45,0.8,fbm(q*vec3(3.0,26.0,3.0)+uTime*0.03))*smoothstep(0.2,0.6,band);
      col=mix(col,vec3(0.92,0.96,1.0),cirrus*0.75);
    } else {
      col=mix(col,uC*1.1,smoothstep(0.6,0.95,lat)*0.5);
    }
    wrap=0.2;
  }

  // storm spots (Great Red Spot, Great Dark Spot)
  if(uSpot.w>0.0&&uId!=10){
    vec3 s=normalize(uSpot.xyz);
    vec3 t=normalize(cross(vec3(0.0,1.0,0.0),s));
    vec3 bt=cross(s,t);
    vec2 e=vec2(dot(p-s,t)/(uSpot.w*1.7),dot(p-s,bt)/uSpot.w);
    float d=length(e)+snoise(p*9.0)*0.1;
    float m=(1.0-smoothstep(0.35,1.0,d))*step(0.0,dot(p,s))*(uId==9?0.75:1.0);
    float swirl=sin(atan(e.y,e.x)*2.0+d*12.0-uTime*0.5)*0.5+0.5;
    col=mix(col,uSpotCol*(0.8+0.35*swirl)*(0.85+0.3*(1.0-d)),m);
    col=mix(col,uC,smoothstep(0.85,1.0,d)*(1.0-smoothstep(1.0,1.2,d))*0.4*step(0.0,dot(p,s)));
  }

  // ── lighting ───────────────────────────────────────────────────────
  vec3 N=bumpK>0.0?bump(Ng,vWorld,h,bumpK):Ng;
  float ndl=dot(N,L);
  float ndv=max(dot(N,V),0.0);
  float term=smoothstep(-0.06,0.12,ndlG); // geometric terminator: bumps never light the night side
  float diffuse;
  if(regolith>0.5){
    float mu0=max(ndl,0.0); float mu=max(dot(N,V),0.001);
    float ls=2.0*mu0/(mu0+mu);           // Lommel–Seeliger: flat full-disc look of real regolith
    diffuse=mix(mu0,ls,0.6)*term;
  } else {
    diffuse=max((ndl+wrap)/(1.0+wrap),0.0)*smoothstep(-0.25,0.1,ndlG);
  }
  if(uId>=6&&uId<=9) diffuse*=mix(0.55,1.0,pow(max(dot(Ng,V),0.0),0.35)); // limb darkening
  float shadow=1.0-cshadow*0.55;
  // ring shadow on the planet
  if(uRing.y>0.0){
    float dn=dot(L,uRingN);
    if(abs(dn)>1e-3){
      float t=dot(uCenter-vWorld,uRingN)/dn;
      if(t>0.0) shadow*=1.0-0.7*ringDensity(length(vWorld+L*t-uCenter));
    }
  }
  vec3 c=col*(0.012+diffuse*1.2*shadow);
  if(spec>0.0){
    vec3 H=normalize(L+V);
    float nh=max(dot(Ng,H),0.0);
    c+=vec3(1.0,0.93,0.8)*(pow(nh,90.0)*1.6+pow(nh,10.0)*0.08)*spec*term*shadow;
  }
  // city lights glow on the night side
  float dark=1.0-smoothstep(-0.18,0.06,ndlG);
  c+=vec3(1.0,0.66,0.3)*night*dark*2.6;
  // atmosphere: rim scatter, blue by day, warm at the terminator
  float fres=pow(1.0-max(dot(Ng,V),0.0),2.5);
  float dayside=smoothstep(-0.3,0.5,ndlG);
  float dusk=smoothstep(-0.25,0.05,ndlG)*(1.0-smoothstep(0.05,0.35,ndlG));
  vec3 sky=mix(uAtmo,vec3(1.0,0.45,0.18),dusk*0.8);
  c+=sky*fres*uAtmoK*(dayside+dusk*0.6);
  if(uId==3) c=mix(c,uAtmo*dayside*0.5,fres*0.35);
  gl_FragColor=vec4(c,1.0);
  #include <colorspace_fragment>
}
`

/** Earth's own cloud layer: drifts over the surface, dark on the night side, warm at dusk. */
export const CLOUD_FRAG = /* glsl */ `
uniform vec3 uSun; uniform float uTime;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld; varying vec3 vLobj;
${COMMON}
void main(){
  float c=cloudAt(vObj,uTime);
  vec3 N=normalize(vN);
  vec3 L=normalize(uSun-vWorld);
  vec3 V=normalize(cameraPosition-vWorld);
  float ndl=dot(N,L);
  float lit=smoothstep(-0.15,0.35,ndl);
  float dusk=smoothstep(-0.2,0.05,ndl)*(1.0-smoothstep(0.05,0.3,ndl));
  vec3 col=mix(vec3(1.0),vec3(1.0,0.55,0.3),dusk)*(0.03+lit*1.05);
  float edge=pow(1.0-max(dot(N,V),0.0),3.0);
  float a=c*(0.92-edge*0.5);
  gl_FragColor=vec4(col*a,a);
  #include <colorspace_fragment>
}
`

/** The Sun: convective granulation, drifting sunspots, faculae, limb darkening. */
export const SUN_FRAG = /* glsl */ `
uniform float uTime;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld; varying vec3 vLobj;
${COMMON}
vec3 ramp(float x){
  vec3 c=mix(vec3(0.45,0.04,0.0),vec3(1.0,0.32,0.02),smoothstep(0.0,0.4,x));
  c=mix(c,vec3(1.0,0.66,0.2),smoothstep(0.35,0.7,x));
  c=mix(c,vec3(1.0,0.93,0.75),smoothstep(0.7,1.0,x));
  return c;
}
void main(){
  vec3 p=vObj;
  float t=uTime*0.12;
  vec3 q=p*2.6;
  vec3 warp=vec3(fbm3(q+vec3(t,0.0,0.0)),fbm3(q+vec3(0.0,t,5.2)),fbm3(q+vec3(3.1,0.0,t)));
  float g=fbm(p*5.0+warp*1.4+vec3(0.0,0.0,t*0.6));
  // granulation cells: bright hot centres, dark lanes
  vec3 cp=p*34.0+warp*2.5;
  float cells=pow(1.0-abs(snoise(cp+t*1.5)),3.5);
  float cells2=pow(1.0-abs(snoise(cp*2.1-t*2.0)),3.0);
  float spots=smoothstep(0.42,0.62,fbm(rotY(p,t*0.15)*1.6+11.0));
  float umbra=smoothstep(0.55,0.68,fbm(rotY(p,t*0.15)*1.6+11.0));
  float temp=0.3+0.3*g+0.3*cells+0.12*cells2-0.3*spots-0.25*umbra;
  vec3 col=ramp(clamp(temp,0.0,1.0));
  vec3 N=normalize(vN);
  vec3 V=normalize(cameraPosition-vWorld);
  float mu=max(dot(N,V),0.0);
  // limb darkening + reddening; faculae brighten near the limb
  float limb=1.0-0.62*(1.0-pow(mu,0.55));
  col*=limb;
  col=mix(col*vec3(1.0,0.5,0.22),col,smoothstep(0.0,0.5,mu));
  float fac=smoothstep(0.55,0.9,fbm(p*14.0+t))*smoothstep(0.6,0.15,mu);
  col+=vec3(1.0,0.75,0.4)*fac*0.35;
  gl_FragColor=vec4(col*1.3,1.0);
  #include <colorspace_fragment>
}
`

export const FLAME_VERT = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);
}
`

/** Camera-facing ring of fire around the solar limb: spicules, licking flames and tall prominences. */
export const FLAME_FRAG = /* glsl */ `
uniform float uTime; uniform float uDisc;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 p=(vUv-0.5)*2.0;
  float r=length(p);
  vec2 dir=p/max(r,1e-4);
  float x=(r-uDisc)/(1.0-uDisc);
  if(x<-0.04) discard;
  float t=uTime;
  // where the tall prominences are this minute
  float zone=smoothstep(0.45,0.85,snoise(vec3(dir*1.4,t*0.035))*0.5+0.5);
  float height=0.06+0.05*(snoise(vec3(dir*6.0,t*0.2))*0.5+0.5)+zone*0.28;
  float xn=max(x,0.0)/height;
  // licking flames: noise advected outward
  float n1=fbm(vec3(dir*5.0,x*7.0-t*0.55))*0.5+0.5;
  float n2=fbm(vec3(dir*13.0+4.0,x*16.0-t*1.1))*0.5+0.5;
  float tongues=smoothstep(0.25,0.75,n1+0.35-xn*0.55)*(0.65+0.7*n2);
  float body=exp(-xn*2.2)*tongues;
  // prominence filaments: thin bright strands inside the tall zones
  float fil=pow(1.0-abs(snoise(vec3(dir*3.0,x*3.0-t*0.12))),8.0)*zone*smoothstep(1.25,0.2,xn);
  float glow=exp(-max(x,0.0)*7.0)*0.55;
  float inner=smoothstep(-0.04,0.0,x);
  vec3 hot=vec3(1.0,0.86,0.55);
  vec3 mid=vec3(1.0,0.42,0.08);
  vec3 cool=vec3(0.75,0.12,0.03);
  vec3 col=mix(hot,mid,smoothstep(0.0,0.5,xn));
  col=mix(col,cool,smoothstep(0.5,1.2,xn));
  vec3 c=col*body*1.6+mid*fil*1.4+vec3(1.0,0.55,0.2)*glow;
  gl_FragColor=vec4(c*inner,1.0);
}
`

/** Atmospheric halo (v2): blue day limb that turns to sunset orange at the terminator. */
export const HALO2_FRAG = /* glsl */ `
uniform vec3 uCenter; uniform float uR; uniform float uShell;
uniform vec3 uSun; uniform vec3 uAtmo; uniform float uK;
varying vec3 vObj; varying vec3 vN; varying vec3 vWorld;
void main(){
  vec3 rd=normalize(vWorld-cameraPosition);
  vec3 oc=uCenter-cameraPosition;
  float tca=dot(oc,rd);
  float d=length(oc-rd*tca);
  float g=1.0-smoothstep(uR,uShell,d);
  g=pow(g,2.4);
  vec3 closest=normalize(cameraPosition+rd*tca-uCenter);
  float s=dot(closest,normalize(uSun-uCenter));
  float lit=smoothstep(-0.45,0.55,s);
  float dusk=smoothstep(-0.4,0.0,s)*(1.0-smoothstep(0.0,0.4,s));
  vec3 col=mix(uAtmo,vec3(1.0,0.42,0.15),dusk*0.85);
  // forward scattering when looking toward the Sun through the limb
  float fwd=pow(max(dot(rd,normalize(uSun-cameraPosition)),0.0),8.0);
  gl_FragColor=vec4(col*g*(lit+dusk*0.8+fwd*1.5)*uK,1.0);
  #include <colorspace_fragment>
}
`
