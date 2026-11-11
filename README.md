# INFINITY — MÖBIUS

Experimental creative showcase. Scroll is a loop, not a line.

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

Specs live in [`docs/`](docs): PROJECT_SPEC, ART_DIRECTION, MOTION_SYSTEM, INTERACTION_SPEC,
COMPONENT_ARCHITECTURE, PERFORMANCE_GUIDELINES, CREATIVE_DIRECTIONS.

## Status
- Phase 3 Visual foundation — tokens, fonts, Lenis ⇄ ScrollTrigger, pointer, cursor, magnetic, grain, nav, angle meter
- Phase 4 Hero (Section 01 · ORIGIN) — particle Möbius strip, word weave, entrance timeline, cursor force field, scroll exit + first flip
- Section 02 is a placeholder (roadmap list) so the hero exit can be reviewed in context

## Key files
| Path | What |
|---|---|
| `src/motion/config.ts` | motion tokens (ease / duration / stagger / lenis) |
| `src/providers/SmoothScrollProvider.tsx` | Lenis + ScrollTrigger sync, single gsap.ticker rAF, refresh strategy |
| `src/sections/S01Origin/Origin.tsx` | hero markup + entrance / exit timelines |
| `src/gl/particles/*` | particle Möbius (ShaderMaterial, all motion in vertex shader) |
| `src/gl/geometry/mobius.ts` | parametric strip + seeded particle buffers |
| `src/components/motion/Magnetic.tsx` | magnetic wrapper (two-layer ownership) |

## Deploy (GitHub Pages)
The site is a static export (`output: "export"` in `next.config.ts`). Pushing to `master` runs
`.github/workflows/deploy-pages.yml`, which builds with `NEXT_PUBLIC_BASE_PATH=/<repo>` and publishes `out/`.
Repo setting: **Settings → Pages → Source: GitHub Actions**.

Local check of the Pages build:
```bash
NEXT_PUBLIC_BASE_PATH=/infinity-web-source npm run build
mkdir -p /tmp/site && cp -r out /tmp/site/infinity-web-source && npx serve /tmp/site   # open /infinity-web-source/
```
Files in `public/` must be referenced through `asset()` from `src/lib/asset.ts` so they get the subpath.

## Texture credits (ORBIT ∞ page)
- Earth day map: NASA Visible Earth, *Blue Marble* (public domain), via [three-globe](https://github.com/vasturiano/three-globe) examples.
- Earth topography, water mask, city lights, clouds and the Moon map: [three.js](https://github.com/mrdoob/three.js) example planet textures (based on NASA imagery).
- Everything else (Sun, Mercury, Venus, Mars, gas and ice giants, rings) is generated procedurally in shaders.
