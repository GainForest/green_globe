# Zoomed project drag control fix

Issue: after selecting a project and zooming into the site boundary, dragging around the close-up area became too aggressive/crazy and the scene quickly became illegible.

Root cause:
- The previous smoothness patch raised `OrbitControls.rotateSpeed` with a high close-zoom minimum (`0.28`).
- At project-site altitude, even a small orbit angle translates to a large geographic shift on screen, so a short drag moved the camera far away from the selected area.
- User interaction during the project-selection `pointOfView` tween could also fight the in-flight camera animation.

Fixes in `src/app/(map-routes)/_utils/GlobeController.ts`:
- Replaced the high close-zoom rotate speed floor with a much smaller project-site floor: `0.00004`.
- Kept far-away globe rotation smooth via altitude-based scaling (`min + altitude * factor`) so global browsing still feels responsive.
- Left zoom speed with square-root altitude scaling for responsive but controlled wheel behavior.
- Added `interruptCameraMotion()` for pointer/wheel interaction:
  - stops auto-rotate,
  - cancels our camera zoom animation,
  - cancels globe.gl's in-flight `pointOfView` tween by resetting the current POV with duration `0`.
- Kept move callback throttling to one animation frame for smooth boundary overlay updates.

Verification:
- `bunx tsc --noEmit --pretty false` passed.
- `bun run lint` passed with existing warnings only.
- Reopened Ayowecca Uganda at selected-site zoom.
- Confirmed selected yellow boundary still renders.
- Simulated a 100px close-zoom drag: boundary/marker moved a controlled amount and stayed legible instead of jumping off-screen.
- `agent_browser errors` reported no page errors.

Evidence:
- `reports/screenshots/local-globe-ayowecca-controlled-zoom-drag.png`
