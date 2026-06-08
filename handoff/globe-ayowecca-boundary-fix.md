# Ayowecca selected boundary fix

Issue: Ayowecca Uganda selected site did not show a yellow boundary.

Root cause:
- Ayowecca's selected site blob is a bare GeoJSON `Feature` whose geometry is `MultiPolygon`.
- The globe boundary projection path assumed all site blobs were `FeatureCollection` and read `collection.features`, so bare Feature blobs produced zero shapes.

Fixes:
- Added `GlobeGeoJsonInput` and `geoJsonInputToFeatures()` in `src/app/(map-routes)/_utils/globe-data.ts`.
- Normalized all supported site geometry inputs before deriving markers/layers:
  - `FeatureCollection`
  - bare `Feature`
  - bare `Geometry`
  - `GeometryCollection`
- Updated `TreesLoadingOverlay.tsx` to use that normalizer before projecting the selected yellow boundary.
- Updated `featureCollectionToMarkerPosition`, `geoJsonToPointData`, `featureCollectionToPolygons`, and `featureCollectionToPaths` to accept the normalized GeoJSON input type.
- Added unit coverage for bare GeoJSON Feature boundaries.

Verification with agent-browser:
- Selected Ayowecca Uganda.
- Confirmed `project-boundary-overlay: true`.
- Confirmed one yellow polygon with 13 points was rendered.
- Captured screenshot: `reports/screenshots/local-globe-ayowecca-boundary.png`.
- `agent_browser errors` reported no page errors.

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` passed: 7 tests.
- `bun run lint` passed with existing warnings.
