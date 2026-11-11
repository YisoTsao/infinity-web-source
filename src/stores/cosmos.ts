/** ORBIT ∞ per-frame values (mutable; never React state). */
export const cosmosState = {
  /** scroll target 0..1 (written by ScrollTrigger) */
  target: 0,
  /** damped progress used by the camera */
  progress: 0,
  /** 0..1 warp intensity added on top of motion streaks (intro / loop) */
  warp: 0,
  /** camera speed, world units per second (smoothed) */
  speed: 0,
  /** set true right after a loop jump so the camera snaps instead of damping back */
  snap: false,
  chapter: 0,
  local: 0,
  visible: true,
}
