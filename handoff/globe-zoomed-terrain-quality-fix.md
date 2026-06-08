# Zoomed terrain quality fix

Issue: after project fit, the site view looked low-resolution because the previous implementation used camera projection zoom to magnify the scene. That made the selected site look bigger, but did not force the globe tile engine to request finer imagery.

Fixes:
- Moved project-site fits closer using actual `pointOfView` altitude so `globe.gl` / three-globe's slippy tile engine can select finer imagery levels.
- Kept the site framed by using a modest projection zoom-out instead of projection zoom-in.
- Raised `globeTileEngineMaxLevel` to `19`.
- Lowered camera near/min-distance configuration so close surface camera distances are allowed without OrbitControls snapping back.
- Kept satellite imagery via `globeTileEngineUrl`.

Files changed:
- `src/app/(map-routes)/_utils/globe-data.ts`
- `src/app/(map-routes)/_utils/globe-data.test.ts`
- `src/app/(map-routes)/_utils/GlobeController.ts`
- `src/config/map.ts`

Verification:
- Agent-browser tested Brain Youth Group project selection.
- Zoomed terrain is visibly sharper while the selected site remains framed and the active marker stays on the site boundary.
- Evidence screenshot: `reports/screenshots/local-globe-brain-high-res-tiles-fit.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/_utils/globe-data.test.ts'` passed.
- `bun run lint` passed with existing warnings.
- `agent_browser errors` reported no page errors.
