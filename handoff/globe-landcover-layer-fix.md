# Globe landcover layer fix

Issue:
- Enabling `Global Land Cover (ESA 2021)` in the Layers tab turned the close Oceanus view black. The legend, yellow boundary, and tree dots stayed visible, but no landcover map rendered.

Root causes:
1. The app was still using the legacy Terrascope `services.terrascope.be/wmts/v2` URL. That endpoint now failed from the local environment with connection resets / no usable tile loads.
2. ESA WorldCover 2021 WMTS tiles on the current Terrascope endpoint are available in EPSG:3857 only for tile matrix levels `6..14`. At close project zoom, the globe tile engine was operating above that range.
3. `GlobeController.syncTileEngine()` cleared the slippy tile cache after changing `globeTileEngineUrl(...)`. In `three-slippy-map-globe`, setting the URL triggers the current-camera tile fetch immediately; clearing after that removed freshly requested/rendered tiles and left the globe blank until another camera update.

Fixes:
- Updated landcover tile URL to the current Terrascope WMTS endpoint:
  - `https://wmts.terrascope.be/`
  - layer: `esa-worldcover-map-10m-2021-v2_map`
  - time: `2021-01-01`
- Added landcover tile level bounds to config:
  - min: `6`
  - max: `14`
- When landcover is active, the globe tile engine max level is reduced to `14` so the slippy engine requests valid WorldCover tiles at close zoom.
- For levels below the WorldCover minimum, the landcover factory falls back to satellite tiles so global/far zoom does not become black.
- Reordered tile-engine sync to clear stale tiles before setting max level / tile URL, allowing the URL setter to trigger fresh tile fetches for the current camera.

Verification:
- Local Oceanus Layers tab before enabling landcover shows satellite imagery.
- Enabling `Global Land Cover (ESA 2021)` renders categorical ESA WorldCover colors instead of black.
- Disabling landcover restores satellite imagery.
- Network shows successful Terrascope WMTS tile requests:
  - `200 GET https://wmts.terrascope.be/?SERVICE=WMTS&REQUEST=GetTile...TILEMATRIX=14...`

Evidence screenshots:
- `reports/screenshots/landcover-fix2-before-toggle.png`
- `reports/screenshots/landcover-fix2-after-toggle.png`
- `reports/screenshots/landcover-fix2-after-toggle-off.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
