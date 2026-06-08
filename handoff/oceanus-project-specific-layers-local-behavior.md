# Oceanus project-specific layers — local globe.gl behavior

Tested locally at `http://127.0.0.1:8910`.

## Flow tested

1. Opened the local homepage.
2. Searched for `Oceanus`.
3. Clicked the `Oceanus Conservation` search result.
4. Confirmed project route loaded:
   - project heading: `Oceanus Conservation`
   - selected site: `Cagwait - Poblacion`
   - yellow selected-site boundary visible
   - tree overlay visible with `1455` dots at the selected-site view
5. Switched to the `Layers` tab.
6. Activated Oceanus project-specific layers.

## Oceanus project-specific layer inventory

Oceanus currently exposes 15 project-specific layer records from ATProto:

- `Tree Delineations Orthomosaic 2024-08-21` — `geojson_line`
- 14 orthomosaic/drone image layers — all `raster_tif`:
  - `Orthomosaic 2024-08-21`
  - `Orthomosaic 2024-08-22`
  - `Orthomosaic 2024-08-23`
  - `Orthomosaic 2024-08-24`
  - `Bitaugan West (2024-08-25)`
  - `Caguyao (2024-12-03)`
  - `Bucto - Sanchez (2025-03-19)`
  - `Bucto - Sotto (2025-03-19)`
  - `Bucto - Cajes (2025-03-19)`
  - `Bucto - Acevedo (2025-03-20)`
  - `Caguyao (2025-03-28)`
  - `Tumanan (2025-04-09)`
  - `Tumanan (2025-08-16)`
  - `Tumanan (2025-10-14)`

## Observed behavior

### Layers tab open, no project-specific layer active

- Opening the `Layers` tab itself no longer blanks the map.
- Satellite imagery remains visible.
- Yellow site boundary and pink tree dots remain visible.

Evidence:
- `reports/screenshots/oceanus-layers-project-specific-before.png`

### Activating `Tree Delineations Orthomosaic 2024-08-21` (`geojson_line`)

- The switch turns on and the URL gains `layers-enabled-layers=Tree Delineations Orthomosaic 2024-08-21`.
- The map auto-zooms to that layer's bounds.
- Satellite imagery remains visible.
- Existing selected-site boundary and tree dots remain visible.
- The delineation layer is not visually prominent at the tested scale / under the existing boundary and tree overlays.

Evidence:
- `reports/screenshots/oceanus-layer-tree-delineations-active.png`

### Activating `Orthomosaic 2024-08-21` (`raster_tif`)

- The switch turns on and the URL includes both enabled layers.
- The map auto-zooms to the raster bounds.
- The raster appears as an orthomosaic patch.
- The surrounding satellite basemap disappears and becomes black outside the COG tile footprint.
- Yellow selected-site boundary and tree dots remain above the raster/black surface.

This differs from Mapbox behavior: current `globe.gl` implementation uses `globeTileEngineUrl`, which supports one active globe tile source, so raster layers replace the satellite tile engine instead of rendering as blended overlays.

Evidence:
- `reports/screenshots/oceanus-layer-orthomosaic-active.png`

### Activating a second raster, `Orthomosaic 2024-08-22`

- The URL keeps multiple raster layer names enabled.
- The newly activated raster becomes the visible tile source.
- The previously enabled raster is no longer visible, even though its switch remains on.
- The view auto-zooms to the second raster bounds.
- Only a small subset of tree dots remains in viewport because the camera moves to the raster footprint.
- The globe remains black outside the active raster tile footprint.

Evidence:
- `reports/screenshots/oceanus-layer-second-orthomosaic-active.png`

### Turning raster layers back off

- Switches/URL can return to no raster layers enabled.
- However, after toggling raster layers off, the view can remain black at the raster-zoomed viewpoint rather than immediately restoring visible satellite imagery.
- ArcGIS satellite requests are made and return `200`, but the rendered globe surface remains black in this state.
- Switching back to the Project tab keeps the black surface until the view is reset/reloaded/refit.

Evidence:
- `reports/screenshots/oceanus-project-specific-all-off-after-toggle.png`
- `reports/screenshots/oceanus-project-tab-after-project-specific-layers.png`

## Network observations

- Raster COG tile requests are made through the Titiler endpoint.
- Many Titiler tile requests return `404` outside the orthomosaic footprint; this matches the visible black area when raster tiles replace the full-globe basemap.
- Satellite tiles from ArcGIS return `200`, but after raster toggling the rendered surface may still remain black until reset.

## Conclusion

Project-specific layers partially work in the local `globe.gl` implementation:

- Vector project-specific layers can be activated and can drive camera bounds.
- Raster `raster_tif` layers are visible, but they currently behave as base-map replacements, not Mapbox-style overlays.
- Multiple raster layers cannot truly stack; the last activated raster is the active tile engine.
- The raster-off restore path is still buggy: satellite imagery may not visibly recover after raster layers are disabled.

For Mapbox parity, project-specific raster layers need a dedicated overlay approach rather than `globeTileEngineUrl` replacement. Options include custom Three.js textured meshes/tiles with opacity over the satellite globe, or an explicit layer mode that communicates that a raster replaces the basemap.
