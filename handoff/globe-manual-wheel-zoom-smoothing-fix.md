# Manual wheel zoom smoothing fix

Issue:
- After zooming into a project site, manual scroll-wheel zoom in/out was too sensitive.
- A small wheel movement could zoom too far, making navigation feel jumpy instead of smooth and controlled.

Fix in `src/app/(map-routes)/_utils/GlobeController.ts`:
- Reduced native OrbitControls zoom sensitivity:
  - lower minimum zoom speed,
  - lower maximum zoom speed,
  - smaller altitude-based zoom scaling,
  - slightly higher damping.
- Added a custom capture-phase wheel zoom handler for map container wheel events:
  - prevents OrbitControls from consuming raw high-delta wheel events,
  - clamps large wheel deltas,
  - applies a small exponential altitude step per wheel event,
  - animates each wheel zoom through `globe.pointOfView(..., 260ms)` for smoother transitions,
  - accumulates continuous wheel events against the current target altitude so repeated scrolling still feels natural,
  - cancels project camera zoom animation when the user starts manual wheel zooming.

Verification:
- Reopened Oceanus selected-site view locally.
- Confirmed trees still render as individual dots and boundary remains visible.
- One `deltaY=120` wheel-out step changed the selected boundary height from about `378.7px` to `340.0px`, a controlled ~10% zoom step instead of a large jump.
- One `deltaY=-120` wheel-in step returned to the prior close view smoothly.
- No page errors.

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
