# Vercel deployment failure investigation

Issue:
- PR deployment failed after `next build` reached lint/type checking warnings.
- The same branch built successfully locally with `bun run build`, so the warnings were not the failure cause.

Investigation:
- `bun run build` passed locally.
- The two new tile API routes originally imported `sharp` for server-side image compositing/stitching:
  - `src/app/api/tiles/raster-with-basemap/route.ts`
  - `src/app/api/tiles/satellite/route.ts`
- Local Next build traces before the first fix included native `sharp` / `libvips` packages in both route traces.
- After removing `sharp`, all Vercel targets still failed. The local Next route table showed 13 dynamic/serverless routes with two separate tile API routes. That likely hit Vercel's Hobby 12 serverless-functions-per-deployment limit.

Fix:
- Removed the `sharp` import from tile handling.
- Replaced native image compositing with SVG image composition:
  - raster-over-basemap mode returns an SVG with base64 inlined satellite + raster tile images when both are available;
  - satellite supertile mode returns an SVG with base64 inlined higher-zoom child tiles;
  - direct/fallback tile responses still return the original image bytes.
- Consolidated the two tile routes into a single route:
  - `src/app/api/tiles/route.ts`
  - `mode=satellite`
  - `mode=raster-with-basemap`
- Removed the old route files:
  - `src/app/api/tiles/satellite/route.ts`
  - `src/app/api/tiles/raster-with-basemap/route.ts`
- Added explicit `export const runtime = "nodejs"` to the consolidated route.

Verification:
- `bun run build` passed.
- Build output now has a single `/api/tiles` route instead of two tile API routes.
- Dynamic/serverless route count is back to 12.
- `.next/server/app/api/tiles/route.js.nft.json` has zero `sharp`, `libvips`, or `@img` traced files.
- Production local server on port 8911 rendered the homepage successfully after route consolidation.
- `/api/tiles?mode=satellite&...sourceZoomOffset=1` returns `200 image/svg+xml`.
- Screenshot evidence:
  - `reports/screenshots/vercel-function-count-fix-production-home.png`
  - `reports/screenshots/vercel-sharp-free-production-home.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
