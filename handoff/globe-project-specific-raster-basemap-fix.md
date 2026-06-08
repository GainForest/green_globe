# Project-specific raster layers black-map fix

Issue:
- On local Oceanus, enabling `Orthomosaic 2024-08-21` made the globe black outside the orthomosaic footprint while the raster patch itself appeared.
- Other Oceanus project-specific orthomosaic layers could do the same.

Root cause:
- The globe.gl migration used `globeTileEngineUrl(...)` for project-specific `raster_tif`/`tms_tile` layers.
- That means a raster layer becomes the globe's active tile source rather than a Mapbox-style overlay.
- Titiler returns `404` for COG tiles outside the orthomosaic footprint, and successful COG tiles can contain transparent/nodata pixels. With the raster as the only tile source, those missing/transparent areas reveal the slippy globe's black backing sphere.

Fix:
- Added a local tile compositing endpoint:
  - `src/app/api/tiles/raster-with-basemap/route.ts`
- Raster/tms dynamic layer tile requests now go through that endpoint.
- The endpoint:
  - fetches the satellite basemap tile for the same `z/x/y`,
  - fetches the project raster tile,
  - composites raster over satellite when both exist,
  - falls back to satellite when the raster tile is missing/non-image,
  - falls back to raster if satellite fails,
  - returns cached image responses.
- The route is SSRF-hardened:
  - only `https` URLs,
  - no redirects followed,
  - private/local hostnames rejected,
  - Titiler URLs must match the configured Titiler host and `/cog/tiles/WebMercatorQuad/...@1x` path,
  - nested Titiler `url=` must point at the configured GainForest storage host.

Files changed:
- `src/app/api/tiles/raster-with-basemap/route.ts`
- `src/app/(map-routes)/(main)/_components/Map/sources-and-layers/dynamic-layers/index.ts`

Verification:
- Local Oceanus, Layers tab, `Orthomosaic 2024-08-21` active:
  - orthomosaic patch appears,
  - satellite basemap remains visible outside the patch,
  - no black map.
- Local Oceanus, `Orthomosaic 2024-08-22` active:
  - second orthomosaic appears,
  - satellite basemap remains visible outside the patch,
  - no black map.
- Turning raster layers off restores satellite basemap.
- Network shows `/api/tiles/raster-with-basemap` image requests returning `200`.

Evidence screenshots:
- `reports/screenshots/oceanus-orthomosaic-2024-08-21-composited-basemap.png`
- `reports/screenshots/oceanus-orthomosaic-2024-08-22-composited-basemap.png`
- `reports/screenshots/oceanus-project-raster-off-basemap-restored.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.

Known limitation:
- Multiple raster layers still do not visually stack because the current globe.gl tile-engine approach has one active raster tile source; the latest active raster wins. The important black-map failure is fixed by compositing each active raster source over satellite tiles.
