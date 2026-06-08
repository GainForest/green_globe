# Manual wheel zoom glitch follow-up

Issue:
- The first custom wheel smoothing used repeated `globe.pointOfView(..., transitionMs)` tweens per wheel event.
- That reduced sensitivity but made manual wheel zoom feel glitchy because rapid wheel events created competing camera tweens.

Fix:
- Replaced repeated tween-based wheel zoom with one RAF-driven custom wheel zoom loop.
- Wheel events are still captured to prevent the native OrbitControls wheel jump.
- Each wheel event updates only a target altitude.
- A single animation frame loop smoothly eases the current POV altitude toward that target with immediate `pointOfView(..., 0)` updates.
- Continued wheel input adjusts the same target instead of starting new globe.gl tweens.
- Pointer drag still cancels wheel zoom and project fly-to animations cleanly.

Verification on Oceanus selected site:
- Initial boundary height: ~378.7px.
- One `deltaY=120` wheel-out step: boundary height ~356.3px, a controlled ~6% zoom step.
- Three additional wheel-out steps: boundary height ~293.4px, gradual instead of jumping.
- Three wheel-in steps returned to ~355.9px smoothly.
- Tree dots remained visible at close zoom, with `clusters: 0`.
- No page errors.

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
