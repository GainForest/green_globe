# globe.gl parity Phase 3 report — site switching and direct URL parity

Goal from `handoff/globe-mapbox-parity-phases.md`:
- Selected-site behavior should be consistent from marker click, search click, direct URL, browser back/forward, and site selector changes.
- Camera, boundary, loader, and tree state should reset on site changes without stale overlays.

## Implementation changes

Updated `src/app/(map-routes)/(main)/_features/navigation/use-store-url-sync.ts`:
- When the URL `project-site-id` changes for the currently loaded project, it now calls `activateSite(shouldZoomToSite)` after `setSiteId(...)`.
- This makes browser back/forward and direct URL site changes re-fetch/re-project the selected site boundary and tree state instead of only updating the selected combobox value.

Updated `src/app/(map-routes)/(main)/_components/ProjectOverlay/store/index.ts`:
- On every site activation:
  - resets `treeOverlayReady`;
  - clears the existing highlighted polygon before fetching the next site boundary.
- If a selected site boundary fetch returns `null`, it clears the highlighted polygon instead of leaving stale geometry visible.

## Verification

### Site selector changes

Project: Bees and Trees Uganda

Flow:
1. Opened direct URL for Bushika.
2. Verified selected site: `Bushika`.
3. Switched selector to `Mbuya`.
4. Verified URL updated to the Mbuya `project-site-id`.
5. Verified boundary changed to Mbuya geometry.

Mbuya eval evidence:
- `site: Mbuya`
- `boundaryOverlay: true`
- `yellowPolygons: 1`
- boundary bbox: `92.7 × 178.3`
- no page errors

### Browser back/forward

Flow:
1. Browser Back from Mbuya to Bushika.
2. Verified URL and combobox returned to Bushika.
3. Verified Bushika boundary restored.
4. Browser Forward back to Mbuya.
5. Verified URL and combobox returned to Mbuya.
6. Verified Mbuya boundary restored.

Back/forward evidence:
- Back/Bushika boundary bbox: `617.9 × 412.9`
- Forward/Mbuya boundary bbox: `92.7 × 178.3`
- no page errors

### Direct URL with trees

Direct Oceanus URL:
`http://127.0.0.1:8910/did:plc:6oxtzu7gxz7xcldvtwfh3bpt?overlay-active-tab=project&project-site-id=at://did:plc:6oxtzu7gxz7xcldvtwfh3bpt/app.certified.location/3mc7yzk2ydk2o&project-views=`

Eval evidence after load:
- `heading: Oceanus Conservation`
- `site: Cagwait - Poblacion`
- `boundaryOverlay: true`
- `yellowPolygons: 1`
- `treeOverlay: true`
- `dots: 1455`
- `clusters: 0`
- `loadingOverlay: false`
- no page errors

Screenshot:
- `reports/screenshots/local-globe-oceanus-phase3-direct-url-trees.png`

## Checks

- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
