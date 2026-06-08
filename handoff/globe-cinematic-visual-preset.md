# Cinematic globe visual preset

Request:
- Make the globe look much cooler.
- Keep the change easy to reverse if it causes problems.

Implementation:
- Added two visual presets in `src/config/map.ts`:
  - `cinematic` — new default.
  - `classic` — previous texture/atmosphere colors plus globe.gl default-style lighting.
- The active preset is controlled by `NEXT_PUBLIC_GLOBE_VISUAL_PRESET`.
  - Default / unset: `cinematic`.
  - Revert: set `NEXT_PUBLIC_GLOBE_VISUAL_PRESET=classic` and restart/rebuild.
- Added the env switch to `.env.example`.

Cinematic preset changes:
- Starfield background image.
- Darker space background color.
- Night-earth fallback texture while tiles load.
- Larger cyan atmosphere glow.
- Cooler directional/fill lighting.

Files changed:
- `src/config/map.ts`
- `src/app/(map-routes)/_utils/GlobeController.ts`
- `.env.example`

Reversal plan:
1. Set this env var:
   ```bash
   NEXT_PUBLIC_GLOBE_VISUAL_PRESET=classic
   ```
2. Restart local dev server or rebuild deployment.
3. No code revert required.

Verification:
- Local homepage renders with starfield/cinematic globe.
- Screenshot evidence:
  - `reports/screenshots/globe-cinematic-preset-home.png`

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- Focused Vitest passed: 9 tests.
- `bun run lint` passed with existing warnings only.
