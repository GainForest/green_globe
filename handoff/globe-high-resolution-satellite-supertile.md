# Higher-resolution globe satellite tiles

Request:
- The cinematic globe looked good, but the globe surface itself still looked low-res.

Implementation:
- Added a high-resolution satellite tile endpoint:
  - `src/app/api/tiles/satellite/route.ts`
- Low zoom satellite tiles now use "supertile" stitching:
  - for a requested globe tile, the server fetches higher-zoom ArcGIS child tiles,
  - stitches them into one larger image,
  - returns that image for the same globe tile footprint.
- This improves global/regional texture sharpness without increasing the slippy-globe tile count or changing project/layer behavior.
- Added `globeCurvatureResolution` to the visual presets and set the cinematic preset to `2.5` for smoother globe/tile geometry.

Reversible controls:
- `.env.example` now documents:
  ```bash
  NEXT_PUBLIC_GLOBE_SATELLITE_SUPERTILE_OFFSET=1
  NEXT_PUBLIC_GLOBE_SATELLITE_SUPERTILE_MAX_LEVEL=5
  ```
- To revert to direct ArcGIS tiles:
  ```bash
  NEXT_PUBLIC_GLOBE_SATELLITE_SUPERTILE_OFFSET=0
  ```
  Then restart/rebuild.
- To revert the whole cinematic look:
  ```bash
  NEXT_PUBLIC_GLOBE_VISUAL_PRESET=classic
  ```

Files changed:
- `src/app/api/tiles/satellite/route.ts`
- `src/config/map.ts`
- `src/app/(map-routes)/_utils/GlobeController.ts`
- `.env.example`

Verification:
- Local homepage renders with the higher-res stitched satellite tiles.
- Network shows successful `200` responses from `/api/tiles/satellite?...sourceZoomOffset=1`.
- Screenshot evidence:
  - `reports/screenshots/globe-high-res-supertile-home.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
