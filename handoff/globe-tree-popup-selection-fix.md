# Tree popup selection / pinning fix

Issue:
- Hovering a tree showed the tree popup and hovering a different tree updated it.
- Leaving the tree area cleared the popup immediately.
- Desired behavior: clicking/selecting a tree should pin the popup so it remains active after mouse leave and can be expanded for details.

Fixes:
- Added persistent selected tree state in `HoveredTreeOverlay/store.ts`:
  - `selectedTreeInformation`
  - `setSelectedTreeInformation(...)`
  - `clearSelectedTreeInformation()`
- `HoveredTreeOverlay/index.tsx` now renders the selected tree as a fallback when there is no transient hover tree.
- `TreeClusterOverlay.tsx` now:
  - previews tree info on hover,
  - pins tree info on click,
  - restores the pinned tree info on mouse leave,
  - allows hover of another tree to temporarily update the popup without replacing the selected tree,
  - clears stale selected tree info when the project/tree layer is torn down.
- `getTreeInformationFromFeature()` now includes `treeUri`, allowing selected-dot matching and restoring the correct selected popup.
- Added a defensive `Array.isArray` guard in `useIndexedOrganizations.ts` so a failed organizations API response does not crash the map while testing/using direct project URLs.

Verification:
- Added focused store coverage in `src/app/(map-routes)/(main)/_components/HoveredTreeOverlay/store.test.ts`:
  - selected tree information is pinned,
  - hovering another tree does not overwrite the selected tree,
  - mouse-leave-style restore returns to the pinned tree,
  - clearing selected tree also collapses the popup state.
- Reviewer subagent found no blockers in the pinning flow.

Checks:
- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/(main)/_components/HoveredTreeOverlay/store.test.ts'` passed: 2 tests.
- `bun run lint` passed with existing warnings only.

Live verification note:
- Attempted to verify on local Oceanus, but measured-tree fetches intermittently failed in the browser session (`Error fetching measured trees`, Hyperindex/PDS fetch failures), so tree dots were unavailable for the final browser click-through.
- The code path was reviewed and the selected-tree state behavior is covered by unit tests.
