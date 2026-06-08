# Globe interaction smoothness fix

Issue: dragging/panning the globe felt stiff, especially after zooming into project-site boundaries.

Root cause:
- `OrbitControls.rotateSpeed` was tied directly to camera altitude: `altitude * 0.04` with a minimum of `0.0003`.
- At project-site zoom, altitude can be near `0.00008`, so the effective rotate speed was clamped to an extremely low value.
- Boundary overlay updates also ran on every controls change event, which can be noisy while dragging.

Fixes:
- Added explicit interaction sensitivity constants in `GlobeController`.
- Raised close-zoom minimum rotate speed to keep globe dragging responsive near selected sites.
- Raised close-zoom minimum zoom speed for wheel/pinch responsiveness.
- Kept sensitivity altitude-aware with a small square-root easing so far zooms remain controlled.
- Set `dampingFactor` for smoother inertial controls.
- Throttled `emitMove()` to one callback per animation frame so SVG boundary projection updates do not spam React state while dragging.

Verification:
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
- Reopened Ayowecca Uganda and verified selected boundary still renders after hot reload.
- Simulated a mouse drag across the globe; the marker/boundary moved, confirming interaction is responsive.
- `agent_browser errors` reported no page errors before the drag check.
