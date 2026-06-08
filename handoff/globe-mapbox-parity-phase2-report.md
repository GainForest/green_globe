# globe.gl parity Phase 2 report — tree dots and clusters

Goal from `handoff/globe-mapbox-parity-phases.md`:
- Render production-like pink tree visualization after selected project trees load.
- Show cluster circles with count labels when many trees overlap.
- Show individual pink dots where sparse.
- Preserve selected yellow boundary and individual tree hover behavior where practical.

## Implementation

Added `src/app/(map-routes)/(main)/_components/Map/TreeClusterOverlay.tsx`.

Behavior:
- Uses loaded `treesAsync` GeoJSON from `ProjectOverlay` store.
- Projects tree lon/lat to screen coordinates through `GlobeController.getScreenCoords()`.
- Recomputes on globe move via `globe.onMove(update)`.
- Performs deterministic screen-space grid clustering.
- Renders:
  - translucent pink cluster circles,
  - black count labels,
  - individual pink dots for sparse cells,
  - blue/white selected tree dot if a preview tree is selected.
- Individual dots call the existing `HoveredTreeOverlay` path using `getTreeInformationFromFeature()`.

Styling/Z-order:
- Added `.tree-cluster-overlay`, `.tree-cluster`, and `.tree-dot` styles in `src/app/(map-routes)/_styles/map.css`.
- Tree overlay uses z-index 11 so clusters render above yellow boundary z-index 10.
- Raised app overlays to z-index 30 and hovered tree overlay to z-index 40 so tree dots/clusters do not cover the sidebar or hover card.
- Clears stale hover tree info when project/tree data is no longer renderable.

## Verification

Local Oceanus direct URL:
`http://127.0.0.1:8910/did:plc:6oxtzu7gxz7xcldvtwfh3bpt?overlay-active-tab=project&search-q=Oceanus%20Conservation&project-site-id=at://did:plc:6oxtzu7gxz7xcldvtwfh3bpt/app.certified.location/3mc7yzk2ydk2o&project-views=`

Agent-browser eval after trees loaded:
- `boundaryOverlay: true`
- `yellowPolygons: 1`
- `treeOverlay: true`
- `clusters: 15`
- `dots: 16`
- Example cluster labels: `82`, `197`, `225`, `4`, `281`, `163`, `40`, `75`, `70`, `146`, `43`, `39`, `31`, `17`, `26`
- `loadingOverlay: false`
- `agent_browser errors`: no page errors
- Sidebar z-index check after fix: desktop overlay `z-index: 30`, tree overlay `z-index: 11`.

Hover check:
- Moving mouse to an individual pink dot produced the existing hovered tree overlay image/card.

Screenshots:
- Initial Phase 2 evidence: `reports/screenshots/local-globe-oceanus-phase2-tree-clusters.png`
- After z-index sidebar fix: `reports/screenshots/local-globe-oceanus-phase2-tree-clusters-after-overlay-zfix.png`

Checks:
- Reviewer subagent found no blockers; one stale-hover edge case was addressed.
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
- `git diff --check` passed for Phase 2 touched overlay/style files.

## Notes / remaining follow-up

- Cluster counts are deterministic and production-like, but not expected to exactly match Mapbox cluster bucket counts because this is a screen-space app-level cluster implementation.
- Phase 3 should verify site switching/direct URL behavior resets this overlay correctly across site changes and browser navigation.
