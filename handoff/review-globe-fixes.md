## Review
- Correct: PASS — all five focused checks pass.
  - (1) Tile-engine off state now resolves to `null` rather than a truthy empty function/string: `GlobeController.syncTileEngine()` computes `activeRaster ?? (landcoverVisible ? getLandcoverTileUrl : null)` and passes `null` when disabled (`src/app/(map-routes)/_utils/GlobeController.ts:321-328`).
  - (2) Programmatic bounds changes stop auto-rotation: `fitBounds()` calls `this.stopAutoRotate()` before `pointOfView()` (`src/app/(map-routes)/_utils/GlobeController.ts:177-185`).
  - (3) Interaction listeners are cleaned up: `attachInteractionHandlers()` adds `pointerdown`/`wheel`; `destroy()` removes both with the same handler (`src/app/(map-routes)/_utils/GlobeController.ts:213-219`, `:286-289`).
  - (4) New source/test files are staged, not untracked: `git status --porcelain=v1 -uall` shows `A` for `useGlobe.ts`, `GlobeController.ts`, `globe-data.ts`, and `globe-data.test.ts`; only `handoff/` files are untracked.
  - (5) No new type/build risk found by read-only gates: `bunx tsc --noEmit --incremental false --pretty false`, `bun test 'src/app/(map-routes)/_utils/globe-data.test.ts'`, `bun run lint`, and `git diff --check` all exited 0. Lint emitted existing warnings outside the checked fixes.
- Fixed: None applied; review was read-only.
- Blocker: None.
- Note: Production `bun run build` was not run to avoid write-heavy build artifacts during the read-only review.
