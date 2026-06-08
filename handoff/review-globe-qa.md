# QA / E2E Review: Mapbox GL JS -> globe.gl migration

Date: 2026-06-01

Scope: read-only inspection of the current worktree diff, e2e/Cucumber suite, mocks, generated reports/screenshots, and globe.gl migration source paths. I did **not** edit source or test files. I parsed the existing `reports/e2e.html` report; it records 12/12 Cucumber scenarios passing, but I did not re-run the suite because this was a read-only QA review.

## Review

### Correct
- The runtime map migration is wired through a shared `GlobeController` abstraction rather than direct Mapbox APIs. Homepage/project map initialization creates the controller and sets project marker callbacks in `src/app/(map-routes)/(main)/_components/Map/hooks/useGlobe.ts:31-45`, then feeds organization marker data at `src/app/(map-routes)/(main)/_components/Map/hooks/useGlobe.ts:59-73`.
- The controller covers the main migrated rendering primitives: HTML project markers (`src/app/(map-routes)/_utils/GlobeController.ts:81-98`, `:365-391`), highlighted polygons and measured-tree points (`:101-131`), dynamic point/polygon/path/raster layers (`:134-157`), landcover/raster tile-engine switching (`:321-328`), tree hover/selection styling (`:331-356`), and fit-bounds behavior (`:176-183`).
- The Cucumber suite has useful happy/error coverage for overlay content: homepage shell (`e2e/features/homepage-shell.feature:3-8`), search-to-project (`e2e/features/search.feature:3-10`), project info/site switching (`e2e/features/project-info.feature:3-8`), layers list/URL sync (`e2e/features/layers.feature:3-11`), biodiversity panels (`e2e/features/biodiversity.feature:3-16`), community (`e2e/features/community.feature:3-6`), and error states (`e2e/features/error-states.feature:3-22`).
- The mocks were updated for globe.gl assets: Mapbox mocks are gone, Terrascope landcover is mocked (`e2e/support/network.ts:202-204`), and `three-globe/example/img` CDN assets are mocked (`e2e/support/network.ts:206-213`).
- There is some unit coverage for GeoJSON-to-globe data conversion and color interpolation in `src/app/(map-routes)/_utils/globe-data.test.ts:46-95`.

### Blocker
Before this migration should be considered QA-complete, add user-visible browser coverage for the globe itself. Current passing e2e scenarios mostly assert React overlay DOM and URL state; they can pass if the globe canvas is blank or if WebGL rendering/layer rendering silently fails.

Concrete missing tests and where to adjust:

1. **Homepage globe render and marker interaction**
   - Evidence: the homepage shell assertion only checks `data-testid="map-root"`, search overlay, and tabs (`e2e/step-definitions/common.steps.ts:19-29`; feature at `e2e/features/homepage-shell.feature:3-8`). `openHomepage` also only waits for `map-root` and `search-input` (`e2e/support/flows.ts:12-19`).
   - Add to `e2e/features/homepage-shell.feature` and `e2e/step-definitions/common.steps.ts` (or a new `e2e/step-definitions/map.steps.ts`): assert a `canvas` exists inside `map-root`, has non-zero dimensions, and at least one globe HTML marker button (for the fixture project) is visible/clickable. Add a scenario that opens the fixture project by clicking the globe marker, not only by search.
   - Add/adjust mocks in `e2e/support/network.ts` only if additional globe asset requests appear; unexpected external requests should not be allowed silently.

2. **Layer toggles must assert rendered/loaded behavior, not just URL updates**
   - Evidence: the layers scenario turns landcover and one project layer on, then only checks URL fragments (`e2e/features/layers.feature:8-11`; step implementation at `e2e/step-definitions/layers.steps.ts:84-95`). The source behavior includes landcover legend rendering (`src/app/(map-routes)/(main)/_components/LayersOverlay/LandcoverControls.tsx:61-78`), project-layer zoom controls (`src/app/(map-routes)/(main)/_components/LayersOverlay/index.tsx:166-190`), and tile-engine behavior (`src/app/(map-routes)/_utils/GlobeController.ts:321-328`).
   - Extend `e2e/features/layers.feature` and `e2e/step-definitions/layers.steps.ts` to assert:
     - landcover switch is checked and legend text such as `Tree cover` is visible;
     - a Terrascope WMTS request is observed after enabling landcover;
     - disabling landcover removes the legend and URL param;
     - enabling a global dynamic layer fetches its GeoJSON fixture;
     - enabling a project-specific layer shows `zoom-to-layer-canopy-plots`, fetches `fixtures/layers/project/canopy-plots.geojson`, and can be disabled/removed.
   - Add raster/TMS fixture coverage in `e2e/fixtures/homepage.ts` and route handling in `e2e/support/network.ts` for `raster_tif`, `tms_tile`, `/cog/tiles/WebMercatorQuad/...`, and `/cog/bounds?...`. Current fixtures only exercise `geojson_points`, while migrated source has dedicated raster code at `src/app/(map-routes)/(main)/_components/Map/sources-and-layers/dynamic-layers/index.ts:46-60` and `:117-119`.
   - Add one precedence scenario: landcover on -> raster on -> raster off should return to landcover, because `syncTileEngine` gives active raster priority over landcover (`GlobeController.ts:321-328`).

3. **Measured-tree map behavior is not covered**
   - Evidence: biodiversity e2e asserts measured-tree panel text and filtering only (`e2e/features/biodiversity.feature:11-16`; `e2e/step-definitions/biodiversity.steps.ts:132-155`). The migrated map code has separate user-visible behavior for tree hover callbacks (`src/app/(map-routes)/(main)/_components/Map/hooks/useHoveredTreeInfo.ts:50-58`), hover overlay rendering (`src/app/(map-routes)/(main)/_components/HoveredTreeOverlay/index.tsx:31-160`), selected-tree highlighting from `tree-uri` (`src/app/(map-routes)/(main)/_components/Map/hooks/useSelectedTreeHighlight.ts:14-34`), and loading shimmer (`src/app/(map-routes)/(main)/_components/Map/TreesLoadingOverlay.tsx:44-71`, `:73-102`).
   - Add a new feature such as `e2e/features/tree-map.feature` (or extend `biodiversity.feature`) plus new/expanded step definitions to cover:
     - a delayed measured-tree endpoint shows the tree loading overlay clipped to the active site, then it disappears after success;
     - hovering a measured tree shows the hover overlay with species, height, DBH, and measurement date;
     - expanding/collapsing the hover overlay works;
     - opening a project URL with `tree-uri=<fixture occurrence URI>` focuses the selected tree and does not show unrelated tree data.
   - Practical selector gap: add stable selectors in source before the e2e can be robust, especially `data-testid="trees-loading-overlay"` in `TreesLoadingOverlay.tsx` and `data-testid="hovered-tree-overlay"` / expand-collapse controls in `HoveredTreeOverlay/index.tsx`.

4. **Shapefile route has no e2e coverage after migration**
   - Evidence: the shapefile route was migrated to `GlobeController` (`src/app/(map-routes)/(shapefile-related)/_components/Map/index.tsx:34-55`, `:76-110`) and renders shapefile polygons/centroid markers (`src/app/(map-routes)/(shapefile-related)/_components/Map/sources-and-layers/shapefile.ts:21-66`), but there is no `e2e/features/*shapefile*` file and no step definitions for `/geo/view`.
   - Add `e2e/features/shapefile.feature` and `e2e/step-definitions/shapefile.steps.ts`:
     - open `/geo/view?source-value=<mocked GeoJSON URL>&overlay-visibility=true`;
     - assert map canvas is visible and the GeoJSON URL input is populated;
     - assert a named centroid marker/feature button appears;
     - toggle `Show Project Markers` off/on and assert project marker visibility changes;
     - cover invalid/500 GeoJSON URL error state if the UI should surface one.
   - Add mocks in `e2e/support/network.ts` for `/shapefiles/gainforest-all-shapefiles.geojson` and a test GeoJSON URL used by the new scenario.

5. **Playwright/Cucumber harness should fail on browser-visible errors and stale artifacts should be cleaned**
   - Evidence: `installMockRoutes` falls through to `route.continue()` for anything unhandled (`e2e/support/network.ts:216`), so unexpected live network requests can hide mock gaps. Hooks do not collect `pageerror`, `console.error`, `requestfailed`, or unexpected requests (`e2e/support/hooks.ts:33-48`). Screenshot setup only creates the directory (`e2e/support/hooks.ts:21-24`) and only writes screenshots on failure (`:50-60`), so old screenshots can remain and mislead review.
   - Adjust `e2e/support/hooks.ts` to collect page errors/console errors/request failures per scenario and fail unless explicitly ignored. Adjust `e2e/support/network.ts` to block or record unexpected third-party requests after an allowlist.
   - Adjust `e2e/support/prepare.ts` to clean `reports/screenshots` before a run, or write run-specific artifact directories. Current screenshots include stale/contradictory states (for example blank or old Mapbox-watermarked images) even though `reports/e2e.html` records all scenarios passing.

6. **Agent-browser/manual visual coverage is not reproducible**
   - Evidence: there are screenshot artifacts such as `reports/screenshots/globe-homepage-agent-browser-qa.png`, but no committed repeatable agent_browser scenario/checklist or test file. The automated suite cannot reliably verify visual globe details like a non-blank textured globe, polygon/raster appearance, hover targeting, or mobile drawer gestures.
   - Before signoff, run and record native `agent_browser` coverage for:
     - homepage textured globe + marker click opens project;
     - direct project page shows highlighted site polygon and measured tree points;
     - landcover and raster layers visually replace/restore tile engine as intended;
     - hover a tree and selected `tree-uri` preview;
     - shapefile `/geo/view` polygon + centroid marker;
     - mobile viewport overlay open/drag/tab switching.
   - Store the checklist/result in a stable handoff artifact (for example `handoff/globe-agent-browser-qa.md`) or convert it into Cucumber scenarios where feasible.

### Note
- Existing e2e report status: parsed `reports/e2e.html` shows all 12 scenarios passed. Treat that as a baseline only; it does not prove the globe rendered correctly because current assertions stop at DOM shell/overlay text.
- CI workflow still exports a Mapbox token (`.github/workflows/e2e-homepage.yml:16-18`). That is not directly a QA failure, but it is stale migration configuration and can mask that globe.gl-specific env/mocks are the real runtime dependency now.
- README still documents Mapbox, but documentation cleanup is outside this QA/e2e scope.
