# globe.gl parity plan for Oceanus/production Mapbox behavior

Source observations: `handoff/production-mapbox-oceanus-observations.md`
Official globe.gl docs consulted: `https://github.com/vasturiano/globe.gl` README and examples.

Relevant official APIs for this plan:
- `pointOfView({ lat, lng, altitude }, ms)` for animated camera movement.
- `globeOffset([px, px])` for left-overlay-aware framing.
- `polygonsData`, `polygonGeoJsonGeometry`, `polygonCapColor`, `polygonStrokeColor`, `polygonAltitude` for selected site fill/boundary.
- `pathsData`, `pathStroke`, `pathPointAlt` for a stronger selected-site outline when polygon stroke alone is not visually sufficient.
- `getScreenCoords(lat, lng, altitude)` for boundary-clipped SVG loading overlays.
- `pointsData` and/or app-level cluster HTML/label layers for tree dots/clusters.
- `htmlTransitionDuration(0)` for marker stability during globe movement.

## Phase 1 — Project selection camera, yellow boundary, boundary-shaped loader

Goal: clicking/search-opening Oceanus opens the Project tab, stops globe rotation, tightly fits the selected site with left overlay padding, shows a bright yellow boundary/fill, and shows a boundary-clipped skeleton while trees load.

Implementation scope:
- Tune bounds-to-POV conversion so tiny project boundaries zoom close enough to be useful.
- Preserve `globeOffset` behavior for desktop overlay padding.
- Render selected site as both a translucent polygon and a stronger yellow path outline.
- Keep/verify the SVG loader clipped by `getScreenCoords` projection of the selected boundary.
- Add stable loader selector for testing.

Verification before Phase 2:
- `agent_browser` click/search Oceanus locally.
- Screenshot immediately after project opens: project tab, close zoom, yellow site boundary.
- Screenshot while trees are loading: loader clipped to boundary if observable.
- Confirm no page errors.

## Phase 2 — Tree rendering parity: pink dots and clustered count circles

Goal: after tree data loads, render production-like pink tree visualization: individual dots at close-enough resolution and cluster circles with count labels when many trees overlap.

Implementation scope:
- Implement deterministic app-level clustering for tree features, or use official globe.gl aggregation layers if they can match the observed visual behavior.
- Preserve hover data for individual trees where practical.
- Render cluster count labels/circles above the selected boundary.

Verification before Phase 3:
- `agent_browser` wait for Oceanus trees to load.
- Screenshot loaded state: pink clusters/counts or dots visible, yellow boundary remains visible.
- Confirm hover/overlay behavior does not regress.

## Phase 3 — Site switching and direct URL parity

Goal: selected-site behavior is consistent from marker click, search click, direct URL, and site selector changes.

Implementation scope:
- Verify/refine direct URL and project-site-id handling.
- Re-run fit/boundary/loader/tree sequence on site selector changes.
- Ensure share URLs and back/forward navigation do not leave stale boundaries/trees.

Verification before Phase 4:
- `agent_browser` open Oceanus direct URL.
- Switch site if multiple sites exist.
- Confirm camera, boundary, loader, and tree state reset correctly.

## Phase 4 — Automated QA hardening and docs cleanup

Goal: make parity repeatable beyond manual screenshots.

Implementation scope:
- Add/extend Cucumber/Playwright assertions for canvas, project boundary layer, loader test id, and tree layer presence.
- Document known globe.gl differences from Mapbox.
- Clean stale Mapbox docs/CI references.

Verification:
- `bunx tsc --noEmit --pretty false`
- `bun run lint`
- `bunx vitest run`
- `bun run build`
- `bun run test:e2e:headless`
- Final `agent_browser` checklist across homepage/project/layers/shapefile.
