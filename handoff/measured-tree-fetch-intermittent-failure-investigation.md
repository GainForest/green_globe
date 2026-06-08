# Measured-tree fetch intermittent failure investigation

## Summary

The intermittent Oceanus tree load failure was caused by transient Hyperindex GraphQL responses, not by `globe.gl`, the tree overlay, or browser CORS.

Oceanus is a large tree dataset, so loading measured trees requires paginating through thousands of Hyperindex records:

- `appGainforestDwcOccurrence`: about 3,189 HumanObservation records.
- `appGainforestAcMultimedia`: about 3,247 multimedia records.

I reproduced the failure outside the browser with direct Node `fetch()` calls to `https://api.hi.gainforest.app/graphql`. Valid paginated requests would intermittently return plain-text HTTP `400 Invalid request body`. The failing page varied between runs:

- Multimedia, page 8 after 700 records.
- Multimedia, page 6 after 500 records.
- Multimedia, page 2 after 100 records.
- Multimedia, page 1 before any records.
- Occurrences, page 2 after 100 records.
- Occurrences, page 6 after 2,500 records.

The same cursor/request often succeeded when retried, which points to a transient upstream Hyperindex/request parsing issue rather than an invalid query or bad cursor.

## Why this hid all tree dots

`fetchMeasuredTreeOccurrences()` fetched these in a single `Promise.all`:

- PDS measurements,
- Hyperindex multimedia,
- Hyperindex occurrences,
- preview PDS occurrences,
- selected tree record.

If multimedia failed transiently, the entire `Promise.all` rejected, even though occurrence coordinates were enough to render tree dots. That set `treesAsync` to error and prevented `TreeClusterOverlay` from rendering.

## Mitigation implemented

- Added `requestHyperindex()` in `src/lib/hyperindex/client.ts`:
  - retries transient Hyperindex failures,
  - treats `400 Invalid request body`, `429`, `5xx`, and fetch/connection failures as retryable,
  - logs retry diagnostics in development,
  - preserves immediate failures for non-retryable query/schema errors.
- Routed Hyperindex reads through the retry wrapper in:
  - `src/lib/atproto/ac-multimedia.ts`
  - `src/app/(map-routes)/(main)/_hooks/use-organization-measured-trees.ts`
  - `src/app/(map-routes)/(main)/_components/ProjectOverlay/store/index.ts`
  - `src/lib/atproto/list-all-organizations.ts`
  - `src/app/(map-routes)/(main)/_hooks/use-organization-members.ts`
- Raised occurrence/multimedia page size from `100` to `500` to reduce Oceanus request count.
- Made measurement and multimedia indexes graceful in measured-tree loading:
  - measurement failure continues without DBH/height,
  - multimedia failure continues without photo URLs,
  - occurrence fetch remains the critical path because coordinates come from occurrences.
- Kept `useIndexedOrganizations()` defensive against non-array API error responses to avoid map crashes when a server-side organization list request fails.

## Verification

Local Oceanus direct URL after the mitigation:

```json
{
  "boundary": true,
  "clusters": 0,
  "dots": 1455,
  "loading": false,
  "overlay": true
}
```

Network inspection showed the Hyperindex requests returned `200` during the verified load.

Checks:

- `bunx tsc --noEmit --pretty false` passed.
- `bunx vitest run 'src/app/(map-routes)/(main)/_components/HoveredTreeOverlay/store.test.ts' 'src/app/(map-routes)/_utils/globe-data.test.ts'` passed: 9 tests.
- `bun run lint` passed with existing warnings only.

## Remaining caveat

The underlying intermittent `400 Invalid request body` behavior appears to be upstream of this app in Hyperindex or its gateway. The app now retries and degrades gracefully, but if Hyperindex returns sustained failures for occurrence pages, measured-tree dots still cannot be built from Hyperindex and would depend on the PDS fallback path.
