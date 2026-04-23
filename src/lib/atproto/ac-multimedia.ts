import { extractCid, buildBlobUrl } from "@/lib/atproto/extract-cid";
import { resolvePdsEndpoint } from "@/lib/atproto/resolve-pds";
import { hyperindexClient } from "@/lib/hyperindex/client";
import { MULTIMEDIA_BY_DID } from "@/lib/hyperindex/queries";
import type { Connection, HiAcMultimedia } from "@/lib/hyperindex/types";

// ── Return types ───────────────────────────────────────────────────────────────

/**
 * Map from occurrence AT-URI to the first blob URL found.
 * Used for species predictions where only one image per occurrence is needed.
 */
export type MultimediaIndex = Map<string, string>;

/**
 * Map from occurrence AT-URI to an object keyed by ac:subjectPart.
 * Used for measured trees where multiple photo angles are needed.
 */
export type MultimediaByOccurrence = Map<
  string,
  {
    entireOrganism?: string;
    leaf?: string;
    bark?: string;
    flower?: string;
    fruit?: string;
    seed?: string;
    stem?: string;
  }
>;

type MultimediaResponse = {
  appGainforestAcMultimedia: Connection<HiAcMultimedia>;
};

const fetchAllMultimedia = async (did: string): Promise<HiAcMultimedia[]> => {
  const records: HiAcMultimedia[] = [];
  let cursor: string | null = null;

  do {
    const response: MultimediaResponse = await hyperindexClient.request(
      MULTIMEDIA_BY_DID,
      {
        did,
        first: 100,
        after: cursor,
      }
    );

    const connection = response.appGainforestAcMultimedia;
    records.push(...connection.edges.map((edge) => edge.node));

    cursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (cursor);

  return records;
};

/**
 * Fetch all app.gainforest.ac.multimedia records for an org and index them
 * by occurrenceRef (AT-URI) → first blob URL only.
 *
 * Used for species predictions where only one image per occurrence is needed.
 */
export const fetchMultimediaIndex = async (
  did: string
): Promise<MultimediaIndex> => {
  const index: MultimediaIndex = new Map();
  const pdsEndpoint = await resolvePdsEndpoint(did);

  for (const record of await fetchAllMultimedia(did)) {
    const occurrenceRef =
      typeof record.occurrenceRef === "string" ? record.occurrenceRef : null;
    if (!occurrenceRef) continue;

    const cid = extractCid(record.file?.ref);
    if (!cid) continue;

    if (!index.has(occurrenceRef)) {
      index.set(occurrenceRef, buildBlobUrl(pdsEndpoint, did, cid));
    }
  }

  return index;
};

/**
 * Fetch all app.gainforest.ac.multimedia records for an org and index them
 * by occurrenceRef (AT-URI) → grouped by ac:subjectPart.
 *
 * Used for measured trees where multiple photo angles (bark, leaf, etc.) are needed.
 */
export const fetchMultimediaByOccurrence = async (
  did: string
): Promise<MultimediaByOccurrence> => {
  const index: MultimediaByOccurrence = new Map();
  const pdsEndpoint = await resolvePdsEndpoint(did);

  for (const record of await fetchAllMultimedia(did)) {
    const occurrenceRef =
      typeof record.occurrenceRef === "string" ? record.occurrenceRef : null;
    if (!occurrenceRef) continue;

    const subjectPart =
      typeof record.subjectPart === "string" ? record.subjectPart : null;
    if (!subjectPart) continue;

    const cid = extractCid(record.file?.ref);
    if (!cid) continue;

    const blobUrl = buildBlobUrl(pdsEndpoint, did, cid);
    const existing = index.get(occurrenceRef) ?? {};
    index.set(occurrenceRef, { ...existing, [subjectPart]: blobUrl });
  }

  return index;
};
