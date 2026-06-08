# Vercel deployment failure investigation

Issue:
- PR deployment failed after `next build` reached lint/type checking warnings.
- The same branch built successfully locally with `bun run build`, so the warnings were not the failure cause.

Investigation:
- `bun run build` passed locally.
- The two new tile API routes imported `sharp` for server-side image compositing/stitching:
  - `src/app/api/tiles/raster-with-basemap/route.ts`
  - `src/app/api/tiles/satellite/route.ts`
- Local Next build traces before the fix included native `sharp` / `libvips` packages in both route traces.
- That is the likely Vercel-specific failure source because native image libraries can fail or exceed/serverlessly bloat deployment function tracing even when local builds pass.

Fix:
- Removed the `sharp` import from both tile routes.
- Replaced native image compositing with SVG image composition:
  - raster-over-basemap route returns an SVG with base64 inlined satellite + raster tile images when both are available;
  - satellite supertile route returns an SVG with base64 inlined higher-zoom child tiles;
  - direct/fallback tile responses still return the original image bytes.
- Added explicit `export const runtime = "nodejs"` to both routes.

Verification:
- `bun run build` passed.
- `.next/server/app/api/tiles/*/route.js.nft.json` now has zero `sharp`, `libvips`, or `@img` traced files.
- Production local server on port 8911 rendered the homepage successfully.
- `/api/tiles/satellite?...sourceZoomOffset=1` returned `200 image/svg+xml`.
- Screenshot evidence:
  - `reports/screenshots/vercel-sharp-free-production-home.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
