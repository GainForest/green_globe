# Phase 1 report — project fit, yellow boundary, boundary-shaped loader

Status: ready for user review. Do **not** proceed to Phase 2 until approved.

## Official globe.gl docs consulted

Source: https://github.com/vasturiano/globe.gl

Relevant documented APIs used/considered:
- `pointOfView({ lat, lng, altitude }, ms)` for camera movement.
- `globeOffset([px, px])` for left-overlay-aware framing.
- `camera()` access for projection zoom refinement after discovering geographic site bounds are too small to be useful with altitude alone.
- `polygonsData` / `polygonStrokeColor` and `pathsData` / `pathStroke` for boundary rendering.
- `getScreenCoords(lat, lng, altitude)` for SVG boundary/loader projection.

## Implemented in Phase 1

- Added phased plan: `handoff/globe-mapbox-parity-phases.md`.
- Tuned project-bound camera fit:
  - `boundsToPointOfView` now supports much closer project-site altitude.
  - Added `boundsToCameraZoom` to zoom the globe camera projection for very small project boundaries.
  - `GlobeController.fitBounds()` applies camera zoom before `pointOfView()`.
- Strengthened selected boundary rendering:
  - `GlobeController.setHighlightedPolygon()` now creates both translucent polygons and yellow outline paths.
  - `TreesLoadingOverlay.tsx` now renders a persistent screen-space yellow project boundary overlay using `getScreenCoords`.
- Added a boundary-shaped loader overlay:
  - Same screen-space projected polygon is used as the clipping path.
  - `data-testid="project-boundary-overlay"` and `data-testid="trees-loading-overlay"` were added for browser verification.

## Agent-browser verification

Local flow tested:
1. Opened `http://127.0.0.1:8910/`.
2. Searched for `Oceanus Conservation`.
3. Clicked the `Oceanus Conservation Philippines` result.
4. Verified Project tab opened and boundary overlay rendered.
5. Verified loader selector rendered.
6. Verified no page errors.

Evidence:
- `reports/screenshots/local-globe-oceanus-phase1-loader-boundary.png`

Programmatic browser check result:

```json
{
  "boundary": true,
  "loader": true
}
```

## Automated checks

- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` — passed
- `bunx tsc --noEmit --pretty false` — passed
- `bun run lint` — passed with existing warnings

## Known Phase 1 limitations / intentionally deferred to Phase 2

- Tree points are still rendered as raw globe.gl cylinders, so at close project zoom they appear oversized and visually disruptive.
- Production-like pink cluster circles/count labels are **not** implemented yet.
- The loader is currently kept visible in project boundary view so the clipped skeleton can be verified; Phase 2 should replace it with the production sequence: loader first, then clustered/dotted tree layer after tree data loads.
- The globe background at extreme camera zoom is not yet production-like satellite-map detail; current phase only addresses camera targeting, boundary, and clipped loader behavior.
