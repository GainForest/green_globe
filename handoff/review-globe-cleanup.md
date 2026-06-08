# Cleanup / Dependency / Type-Safety Review: Mapbox GL JS -> globe.gl

Date: 2026-06-01
Scope: read-only review of current worktree. No source edits were made; this file is the requested handoff artifact.

## Review

### Correct
- **Package migration is coherent.** `package.json` removes `mapbox-gl`, `@mapbox/mapbox-gl-draw`, and `@types/mapbox__mapbox-gl-draw`, and adds `globe.gl` (`package.json:40-103`, especially `package.json:73`). `bun.lock` includes `globe.gl@2.46.1` and its `three`/`three-globe` dependency set (`bun.lock:40`, `bun.lock:1462`, `bun.lock:2072-2082`). A direct grep of `package.json` and `bun.lock` found no remaining Mapbox entries.
- **Runtime source no longer imports Mapbox.** The deleted files are the expected Mapbox-specific hook/source/layer files (`useMapbox.ts`, dynamic Mapbox layer helpers, landcover/project marker/site Mapbox layers). `git grep` found no remaining `useMapbox`, `mapbox-gl`, or deleted helper imports under `src/`.
- **`src/config/map.ts` is Mapbox-free.** It now defines globe initial POV/config and Terrascope landcover tile URL (`src/config/map.ts:1-19`).
- **`globe.gl` is currently isolated to client-only runtime paths.** The main map is a client component (`src/app/(map-routes)/(main)/_components/Map/index.tsx:1`) and initializes through `useGlobe()` (`Map/index.tsx:17`). `GlobeController` uses a type-only `GlobeInstance` import (`src/app/(map-routes)/_utils/GlobeController.ts:1`) and dynamically imports `globe.gl` only inside `GlobeController.create()` (`GlobeController.ts:63-74`). The shapefile map is also a client component before importing/creating the controller (`src/app/(map-routes)/(shapefile-related)/_components/Map/index.tsx:1-4`, `:34-38`).
- **Type/lint checks are currently clean enough for this migration scope.** `./node_modules/.bin/tsc --noEmit --incremental false --pretty false` passed with no output. `bun run lint` passed; it reported existing warnings in non-migration components, but no hard lint errors. `git diff --check` passed.
- **E2E network mocks were moved away from Mapbox.** `e2e/support/network.ts` now mocks Terrascope tiles and `cdn.jsdelivr.net` `three-globe/example/img` assets (`e2e/support/network.ts:202-213`) instead of Mapbox style/font/session endpoints.

### Blocker
- **New migration source files are untracked, while tracked files depend on them.** `git status --short` shows these untracked source/test files:
  - `src/app/(map-routes)/(main)/_components/Map/hooks/useGlobe.ts`
  - `src/app/(map-routes)/_utils/GlobeController.ts`
  - `src/app/(map-routes)/_utils/globe-data.ts`
  - `src/app/(map-routes)/_utils/globe-data.test.ts`

  This is a release blocker unless intentional: tracked files import these paths (`Map/index.tsx:7`, `src/config/map.ts:1`, shapefile `Map/index.tsx:4`). If only tracked modifications are committed, the build will fail from missing modules.

- **Default landcover sync can blank/replace the base globe texture.** The layer store defaults landcover to `false` (`src/app/(map-routes)/(main)/_components/LayersOverlay/store/index.ts:35-39`), and `useLandcoverLayer` calls `globe.setLandcoverVisible(false)` once the globe is loaded (`src/app/(map-routes)/(main)/_components/Map/hooks/useLandcoverLayer.ts:12-17`). That reaches `syncTileEngine()`, which passes the non-null `EMPTY_TILE_ENGINE` function to `globeTileEngineUrl` when no raster/landcover layer is active (`GlobeController.ts:29`, `:155-157`, `:321-328`). In `three-globe`, any truthy `globeTileEngineUrl` hides the normal globe mesh (`node_modules/three-globe/dist/three-globe.mjs:690-691`). Result: the default false/off state can switch the globe into tile-engine mode with empty tile URLs instead of showing the configured base image. Build/typecheck will not catch this; it needs runtime fix/verification before production.

### Cleanup tasks
- **Remove or ignore untracked capture artifacts before committing.** `git status --short` shows top-level `network.har` and `pi-session-2026-05-21T09-58-47-038Z_019e49f9-2bfd-7444-a0db-0dacb281b685.html`. `network.har` contains Mapbox URLs with a public access token (`network.har:3988` and many later lines). These should not be committed; either delete them or add appropriate `*.har` / session HTML ignore rules.
- **Decide what to do with untracked handoff files.** `handoff/review-globe-architecture.md` and `handoff/review-globe-qa.md` are untracked. Keep them untracked if they are session handoff artifacts, or explicitly add/ignore the `handoff/` policy.
- **Update stale Mapbox docs/config.** Tracked runtime source is clean, but docs/workflow still advertise Mapbox:
  - `.github/workflows/e2e-homepage.yml:16-18` still exports `NEXT_PUBLIC_MAPBOXGL_ACCESSTOKEN`.
  - `README.md:3`, `README.md:13`, `README.md:27`, `README.md:44`, `README.md:113`, `README.md:204` still describe Mapbox and `useMapbox.ts`.
  - `AGENTS.md:5`, `AGENTS.md:146-147` still list Mapbox and Mapbox env vars.
- **Bring `.env.example` back in sync with actual map dependencies.** Removing Mapbox vars is correct (`.env.example:23-36` now has no Mapbox), but the example also omits map/runtime vars still used by code: `NEXT_PUBLIC_AWS_STORAGE` (`src/app/(map-routes)/_utils/map.ts:5-8`, `src/lib/utils.ts:61`) and `NEXT_PUBLIC_TITILER_ENDPOINT` for raster COG layers (`src/app/(map-routes)/(main)/_components/Map/sources-and-layers/dynamic-layers/index.ts:49-52`). It should also document external unauthenticated runtime dependencies such as Terrascope (`src/config/map.ts:18-19`) and the globe texture CDN (`src/config/map.ts:11-12`).
- **Pin or self-host globe texture assets.** `GLOBE_CONFIG` uses unversioned jsDelivr `three-globe` example image URLs (`src/config/map.ts:11-12`). This is production-visible behavior and can change with upstream package examples/CDN availability. Prefer version-pinned URLs matching the lockfile or local assets under `public/`.
- **Review `tmp/` and `reports/` only as local disk cleanup.** They contain many artifacts, but they are already ignored by `.gitignore` (`.gitignore:15`, `.gitignore:51`) and do not show in `git status`.
- **Optional code cleanup:** `useTreesLoadingOverlay.ts` is now a no-op and unreferenced (`src/app/(map-routes)/(main)/_components/Map/hooks/useTreesLoadingOverlay.ts:1-6`; grep found no imports). Remove it if no longer needed.

### Note
- **`globe.gl` typing risk is currently acceptable.** The package ships its own `dist/globe.gl.d.ts` and the repository typecheck passed. There is no local `declare module "globe.gl"` shim, which is fine for `globe.gl@2.46.1`.
- **Keep `globe.gl` out of server/static imports.** The distributed module references `window` at top level (`node_modules/globe.gl/dist/globe.gl.mjs:155`), so any future static value import from a server component/module can break SSR/build. The current type-only import plus `useEffect`/dynamic import pattern is the right direction (`GlobeController.ts:1`, `:67`).
- **Build was not run** to preserve the requested read-only posture because `next build` writes `.next/`. Run `bun run build` after resolving the blockers above.
