# globe.gl parity Phase 2 follow-up — Oceanus tree dots and loader sync

User-reported issues:
- Oceanus close selected-site view rendered clustered count circles, but production/main shows individual pink tree dots at that zoom.
- The skeleton loader could disappear before trees appeared, leaving a visible gap.
- When zooming back out toward the globe, pink tree dots/clusters remained visible around the globe.

Production/main comparison:
- Main branch Mapbox tree source uses `cluster: true`, `clusterMaxZoom: 15`, `clusterRadius: 50`.
- At the Oceanus selected-site zoom shown in production, Mapbox is past the cluster cutoff, so the visible layer is `unclusteredTrees`: small pink circles with black stroke.
- Production loader is tied to tree loading state and does not intentionally linger after trees are available.

Fixes:
- Updated `TreeClusterOverlay.tsx`:
  - Close selected-site altitude now renders all visible trees as individual dots, not clusters.
  - Dots now match Mapbox styling more closely: `#ff77c1` fill, black stroke, 4px radius; selected trees use larger pink/white styling; hover turns blue/white.
  - Tree overlay is hidden when globe altitude is above the project-tree threshold, preventing pink dots/clusters from leaking into zoomed-out/global globe views.
- Updated `TreesLoadingOverlay.tsx`:
  - Removed fixed timeout/later fade behavior.
  - Loader now stays visible while tree data is loading and also while tree data has resolved but the tree overlay has not yet produced renderable items.
- Added `treeOverlayReady` in `Map/store`:
  - Reset on project selection, site activation, and tree refresh.
  - Set true only after `TreeClusterOverlay` computes non-empty visible render items.
  - Not reset merely because the user zooms out, so the loader does not reappear after trees have already rendered.

Verification:
- Local Oceanus marker/direct project flow:
  - selected boundary rendered: `yellowPolygons: 1`
  - tree overlay rendered: `treeOverlay: true`
  - individual tree dots rendered: `dots: 1455`
  - clusters at selected-site zoom: `clusters: 0`
  - loader hidden once dots were present: `loadingOverlay: false`
- Zoomed out with wheel:
  - tree overlay hidden: `treeOverlay: false`
  - dots: `0`
  - clusters: `0`
- `agent_browser errors`: no page errors.

Evidence:
- Individual dots: `reports/screenshots/local-globe-oceanus-phase2-individual-tree-dots-loader-sync.png`
- Zoomed-out tree overlay hidden: `reports/screenshots/local-globe-oceanus-zoomed-out-trees-hidden.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
- Reviewer subagent found no blockers after the loader/tree readiness fix.
