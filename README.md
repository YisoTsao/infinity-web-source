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
