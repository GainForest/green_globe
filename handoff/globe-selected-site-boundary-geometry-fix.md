# Selected site boundary geometry fix

Issue: selected yellow boundaries did not render for Bees and Trees Uganda sites.

Root cause:
- Bees and Trees Uganda site blobs are stored as GeoJSON `LineString` boundary rings, not `Polygon` / `MultiPolygon` geometries.
- The screen-space selected boundary overlay only handled Polygon and MultiPolygon, so it returned zero rings and rendered nothing.
- Active project marker positioning also only considered polygons, so line-stored sites could not use the selected site geometry as the marker anchor.

Fixes:
- Updated `TreesLoadingOverlay.tsx` to render selected boundaries from:
  - `Polygon`
  - `MultiPolygon`
  - `LineString`
  - `MultiLineString`
  - `Point` / `MultiPoint` fallback circles
- LineStrings with 3+ coordinates are treated as closed boundary rings and rendered as yellow filled/stroked polygons; shorter lines render as yellow polylines.
- Updated `featureCollectionToMarkerPosition()` to calculate active marker anchors for line, multiline, point, and multipoint geometries too.
- Added unit coverage for line-stored boundary marker position.

Verification with agent-browser:
- Bees and Trees Uganda selected site `Bushika`: boundary rendered.
- Switched site dropdown to `Bethany`: boundary rendered.
- Switched site dropdown to `Mbuya`: boundary rendered.
- Switched site dropdown to `Wokukiri`: boundary rendered.
- No page errors.

Evidence screenshots:
- `reports/screenshots/local-globe-bees-bushika-boundary.png`
- `reports/screenshots/local-globe-bees-wokukiri-boundary.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` passed.
- `bun run lint` passed with existing warnings.
