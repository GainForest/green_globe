# Active project marker fix

Issue: after zooming into a selected site, the visible project marker could remain at the organization map point instead of the selected site boundary. At close globe zoom, `htmlAltitude(0.01)` also introduced visible parallax/offset, so marker placement drifted away from the boundary.

Fixes:
- Added `featureCollectionToMarkerPosition()` in `src/app/(map-routes)/_utils/globe-data.ts` to compute an area-weighted marker coordinate from the active site polygon/multipolygon.
- Added `useActiveProjectMarker()` so the active project marker is relocated to the selected site polygon while the project is open.
- Added `GlobeController.setActiveProjectMarker()` and filtered the original project marker for the same DID to avoid duplicate markers.
- Changed globe HTML marker altitude from `0.01` to `0`, removing close-zoom parallax.
- Added marker data attributes and z-index styling for verification/stacking.

Verification:
- Tested Brain Youth Group with agent-browser.
- Marker now renders inside the yellow site boundary and remains aligned after a small drag.
- Programmatic check: marker center was inside the projected boundary bbox.
- Evidence screenshots:
  - `reports/screenshots/local-globe-brain-active-marker-site-boundary.png`
  - `reports/screenshots/local-globe-brain-active-marker-after-drag.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` passed.
- `bun run lint` passed with existing warnings.
