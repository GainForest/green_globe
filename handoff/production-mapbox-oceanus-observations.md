# Production Mapbox behavior: Oceanus Conservation

Date: 2026-06-01
Target: https://data.gainforest.app/
Project clicked: **Oceanus Conservation**
Final URL observed: `https://data.gainforest.app/did:plc:6oxtzu7gxz7xcldvtwfh3bpt?overlay-active-tab=project&search-q=Oceanus%20Conservation&project-site-id=at://did:plc:6oxtzu7gxz7xcldvtwfh3bpt/app.certified.location/3mc7yzk2ydk2o`
Selected site: **Cagwait - Poblacion**

## Observed interaction sequence

1. Opened the production homepage and searched for `Oceanus Conservation`.
2. Clicked the `Oceanus Conservation Philippines` search result.
3. The app switched from the Search tab to the Project tab and opened the Oceanus project overlay.
4. The map flew/zoomed from the global globe view into a close satellite view over Cagwait, Philippines.
5. The camera fit the selected site on the visible map area to the right of the left-side overlay, preserving enough padding so the project boundary is not hidden by the overlay.

## Zoom / camera behavior to preserve

- The transition feels like a Mapbox `fitBounds`/fly-to site animation: global globe -> close orthographic/satellite site view.
- The final zoom is tight enough that the selected project polygon occupies a large portion of the visible map, not just a small marker-level view.
- The left project overlay remains open during/after the zoom, and the map framing accounts for that left overlay.
- The final map is stable after the zoom; it does not continue drifting/rotating.

## Yellow project boundary behavior

- A bright yellow outline appears around the selected site boundary.
- The boundary is an irregular multi-segment polygon around the `Cagwait - Poblacion` site.
- The polygon sits above the satellite imagery and remains clearly visible at the final zoom.
- The polygon interior has a subtle translucent fill/overlay, making the selected project area visually distinct without fully obscuring satellite details.
- The green project marker remains visible near the center of the selected boundary.

## Boundary-shaped skeleton loader

- Immediately after the project opens and before tree data finishes loading, the loading state is clipped to the same project boundary shape.
- The skeleton/shimmer does not appear as a generic rectangle; it conforms to the selected site polygon.
- This creates a clear visual message: tree/project data is loading specifically for the selected boundary area.
- Once tree data is available, the loader disappears and the tree layer appears.

## Tree layer behavior

- After several seconds, the measured-tree layer loads over the site.
- At the observed zoom, trees are rendered mostly as translucent pink cluster circles with black count labels, not only individual dots.
- Observed cluster labels included counts such as `151`, `91`, `64`, `51`, `16`, `509`, `261`, `284`, and `8`.
- At least one individual small pink dot was visible near the eastern side of the map, outside/near the main cluster view.
- Pink tree clusters render above the satellite imagery and yellow boundary.
- The yellow boundary remains visible while tree clusters are present.

## Evidence captured

- Search result before click: `reports/screenshots/production-mapbox-oceanus-search.png`
- Immediately after click / zoomed project boundary: `reports/screenshots/production-mapbox-oceanus-after-click-immediate.png`
- Boundary visible before tree clusters: `reports/screenshots/production-mapbox-oceanus-loading-plus-boundary.png`
- Tree clusters loaded: `reports/screenshots/production-mapbox-oceanus-after-wait.png`

## Migration implication

The globe.gl replacement should mimic this user-visible sequence:

1. Click project marker/search result.
2. Open Project tab and selected site.
3. Stop globe rotation.
4. Fit/zoom tightly to selected site with left-overlay padding.
5. Draw a high-contrast yellow selected-site polygon.
6. Show a boundary-clipped loading shimmer while trees load.
7. Replace the loader with pink tree points/clusters while preserving the boundary overlay.
