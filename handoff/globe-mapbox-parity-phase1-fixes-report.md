# Phase 1 fixes after user review

Status: ready for user verification. Phase 2 has not been started.

## Reported issues addressed

1. **Abrupt project zoom**
   - Replaced the instant camera zoom snap with an animated camera-zoom tween synchronized with `globe.gl`'s documented `pointOfView(..., transitionMs)` transition.
   - Project fit now uses an 1800ms transition.

2. **Buggy/glitchy navigation at project zoom**
   - Reduced the extreme camera zoom cap from the prior experimental value to a small max of `4`.
   - Retuned OrbitControls speed at close altitude and emit move updates from the controls `change` event so the SVG boundary tracks during drags.
   - Verified with agent-browser mouse drag; boundary remains in view and no page errors were reported.

3. **Duplicate yellow boundary**
   - Removed the globe.gl yellow polygon/path stroke.
   - The selected site is now drawn by one screen-space SVG yellow outline/fill layer only.

4. **No terrain details / visual artifacts**
   - Enabled a default satellite tile engine using `globeTileEngineUrl`, with ArcGIS World Imagery tiles.
   - Removed the raw globe.gl tree-cylinder rendering from Phase 1 because it produced huge pink streaks at close project zoom. Tree rendering is still reserved for Phase 2 clustered/dot overlay parity.
   - Added e2e network mocking for `server.arcgisonline.com` tiles.

## Official globe.gl docs used

From the official `globe.gl` README:
- `pointOfView({ lat, lng, altitude }, ms)` — camera transition duration.
- `globeOffset([px, px])` — left-overlay-aware framing.
- `globeTileEngineUrl(fn)` — slippy map tile engine for detailed satellite terrain.
- `getScreenCoords(lat, lng, altitude)` — projecting the selected boundary into the SVG overlay.
- `camera()` / `controls()` — used for controlled projection zoom and control-speed stabilization.

## Agent-browser evidence

Screenshots:
- Final selected boundary with satellite terrain and no raw tree artifacts: `reports/screenshots/local-globe-oceanus-phase1-fixes-no-white-stroke.png`
- Drag verification after control-speed tuning: `reports/screenshots/local-globe-oceanus-phase1-fixes-after-drag-final.png`

Browser checks:
- `agent_browser errors` — no page errors.
- Console only showed existing React DevTools / motion warnings.

## Automated checks

- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` — passed.
- `bunx tsc --noEmit --pretty false` — passed.
- `bun run lint` — passed with existing warnings.

## Phase 2 remains pending

Measured-tree parity is intentionally deferred. Current raw tree cylinders are hidden at project zoom because they caused the visual artifacts you reported. Phase 2 should implement the production-like pink dots/clusters/count labels on top of the satellite terrain and yellow boundary.
