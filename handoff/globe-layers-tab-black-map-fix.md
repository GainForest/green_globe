# Layers tab black map fix

Issue:
- Switching from Project to Layers caused the satellite imagery to disappear and left the selected site/tree overlay on a black globe.

Root cause:
- Opening the Layers tab fetches many available dynamic/project-specific layers.
- `useDynamicLayers()` asks the globe controller to remove every invisible layer.
- `GlobeController.removeDynamicLayer()` was clearing/re-syncing the globe tile engine even when the named layer had never been added and even when the layer was not raster-backed.
- Repeated satellite tile cache clears at close project zoom caused the globe imagery to blank out.

Fix:
- Initialize the globe tile engine to the default satellite imagery during globe setup.
- Make `setLandcoverVisible(false)` a no-op when landcover is already off.
- Make `removeDynamicLayer()` only re-render the affected layer family and only sync/clear the tile engine when an actual raster layer was removed.

Verification:
- Local Oceanus Project tab shows satellite imagery before switching.
- After switching to Layers, satellite imagery remains visible with the selected boundary and tree dots.
- Evidence screenshots:
  - `reports/screenshots/layers-black-fix-before-switch-2.png`
  - `reports/screenshots/layers-black-fix-after-switch.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
