# Globe.gl migration architecture review

## Critical blockers
- **Tile-engine disable path can blank the default globe.** `GlobeController.syncTileEngine()` passes a truthy `EMPTY_TILE_ENGINE` function when no raster/landcover layer is active (`src/app/(map-routes)/_utils/GlobeController.ts:29`, `:321-328`). `useLandcoverLayer` calls this on initial load with the default `false` landcover state (`src/app/(map-routes)/(main)/_components/Map/hooks/useLandcoverLayer.ts:12-17`). globe.gl documents that a **falsy value** disables tile mode (`node_modules/globe.gl/README.md:135`), and the implementation hides the image globe whenever `globeTileEngineUrl` is truthy (`node_modules/globe.gl/dist/globe.gl.js:169726-169727`). Result: the normal earth texture is likely hidden/blank after the first landcover sync.

## High issues
- **Programmatic bounds fits do not stop auto-rotation.** Auto-rotate is enabled at controller setup (`src/app/(map-routes)/_utils/GlobeController.ts:271-273`) and is only stopped by pointer/wheel events (`:282-289`). `fitBounds()` changes the POV but leaves auto-rotate on (`:176-183`), while URL/project/layer bounds apply through `useBounds` (`src/app/(map-routes)/(main)/_components/Map/hooks/useBounds.ts:15-22`). Direct project URLs, preview bounds, or layer zooms can therefore drift away without user interaction.
- **Destructor leaks container event listeners.** `attachInteractionHandlers()` registers `pointerdown` and `wheel` listeners on the persistent container (`src/app/(map-routes)/_utils/GlobeController.ts:282-289`), but `destroy()` only disconnects the resize observer, clears move listeners, calls `_destructor()`, and clears children (`:211-216`). React remount/StrictMode can leave old listeners calling into destroyed controllers.

## Medium issues
- **Raster/landcover layering regresses from Mapbox semantics.** The controller has one `activeRasterLayerName` and one globe tile engine (`src/app/(map-routes)/_utils/GlobeController.ts:48-50`, `:149-157`, `:321-328`). A dynamic raster/tile layer wins over landcover instead of compositing, and tile mode replaces the base globe texture rather than overlaying it.
- **Tree rendering lost Mapbox clustering.** The new tree path converts all measured trees into globe points (`src/app/(map-routes)/_utils/GlobeController.ts:114-121`, `:305-309`) with `pointsMerge(false)` (`:227-234`). The previous Mapbox source clustered trees; large projects should be performance-tested before accepting this behavior.
- **Shared/current bounds are approximate, not exact.** `getMapBounds()` now returns `getApproxBounds()` (`src/app/(map-routes)/(main)/_components/Map/store/index.ts:31-35`), which derives a square span only from POV altitude (`src/app/(map-routes)/_utils/globe-data.ts:105-120`). Share URLs still treat these as exact viewport bounds (`src/app/(map-routes)/(main)/_components/ShareDialog/index.tsx:126-131`).
- **Stale Mapbox references remain outside the migrated source.** Runtime source under `src/` no longer imports Mapbox, and `package.json` removes `mapbox-gl`, but README still documents Mapbox (`README.md:3`, `:13`, `:27`, `:44`) and the homepage E2E workflow still exports `NEXT_PUBLIC_MAPBOXGL_ACCESSTOKEN` (`.github/workflows/e2e-homepage.yml:16-19`). The worktree also has an untracked `network.har` with Mapbox URLs/tokens.

## Positives
- `GlobeController` gives the app a single adapter boundary over globe.gl, and main hooks use controller methods rather than raw globe.gl calls.
- globe.gl is dynamically imported in the client path (`src/app/(map-routes)/_utils/GlobeController.ts:63-75`), avoiding an obvious SSR import hazard.
- Project marker creation and navigation are coherent: organizations are converted to `GlobeHtmlDatum` (`src/app/(map-routes)/(main)/_components/Map/hooks/useGlobe.ts:59-73`), and marker clicks route through the project overlay/navigation callback (`src/app/(map-routes)/_utils/GlobeController.ts:384-388`).
- GeoJSON point/polygon/path conversion has targeted tests (`src/app/(map-routes)/_utils/globe-data.test.ts:46-96`). I ran `bun test 'src/app/(map-routes)/_utils/globe-data.test.ts'` (4 pass), `bunx tsc --noEmit` (pass), and `bun run lint` (pass with existing warnings).

## Next verification steps
1. Fix tile-engine disable to pass a falsy value, then manually verify initial globe load, landcover on/off, dynamic raster on/off, and fallback to the base globe.
2. Decide the intended auto-rotate lifecycle; verify direct project URL, preview tree URL, layer zoom, and shapefile viewer focus do not drift.
3. Add cleanup coverage/manual StrictMode remount check for controller destruction.
4. Load a project with a large measured-tree dataset and profile FPS/memory before/after tree rendering.
5. Manually verify share URL round-trip expectations and update copy/docs if bounds remain approximate.
