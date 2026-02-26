import ClimateAIAgent from "@/lib/atproto/agent";
import { PDS_ENDPOINT } from "@/config/atproto";
import { extractCid, buildBlobUrl } from "@/lib/atproto/extract-cid";

// ── Constants ──────────────────────────────────────────────────────────────────

const AC_MULTIMEDIA_COLLECTION = "app.gainforest.ac.multimedia";

// ── Raw record shapes ──────────────────────────────────────────────────────────

export type RawMultimediaValue = {
  occurrenceRef?: unknown;
  subjectPart?: unknown;
  file?: { ref?: unknown; mimeType?: string };
  accessUri?: unknown;
  [k: string]: unknown;
};

export type RawMultimediaRecord = {
  uri: string;
  cid: string;
  value: RawMultimediaValue;
};

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

// ── Fetchers ───────────────────────────────────────────────────────────────────

/**
 * Fetch all app.gainforest.ac.multimedia records for an org and index them
 * by occurrenceRef (AT-URI) → first blob URL only.
 *
 * Used for species predictions where only one image per occurrence is needed.
 */
export const fetchMultimediaIndex = async (
  did: string,
): Promise<MultimediaIndex> => {
  const index: MultimediaIndex = new Map();
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: AC_MULTIMEDIA_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawMultimediaRecord[] | undefined;
    if (page?.length) {
      for (const record of page) {
        const v = record.value;
        const occurrenceRef =
          typeof v.occurrenceRef === "string" ? v.occurrenceRef : null;
        if (!occurrenceRef) continue;

        const cid = extractCid(v.file?.ref);
        if (!cid) continue;

        // For species images, we only care about the first image per occurrence
        if (!index.has(occurrenceRef)) {
          index.set(occurrenceRef, buildBlobUrl(PDS_ENDPOINT, did, cid));
        }
      }
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return index;
};

/**
 * Fetch all app.gainforest.ac.multimedia records for an org and index them
 * by occurrenceRef (AT-URI) → grouped by ac:subjectPart.
 *
 * Used for measured trees where multiple photo angles (bark, leaf, etc.) are needed.
 */
export const fetchMultimediaByOccurrence = async (
  did: string,
): Promise<MultimediaByOccurrence> => {
  const index: MultimediaByOccurrence = new Map();
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: AC_MULTIMEDIA_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawMultimediaRecord[] | undefined;
    if (page?.length) {
      for (const record of page) {
        const v = record.value;
        const occurrenceRef =
          typeof v.occurrenceRef === "string" ? v.occurrenceRef : null;
        if (!occurrenceRef) continue;

        const subjectPart =
          typeof v.subjectPart === "string" ? v.subjectPart : null;
        if (!subjectPart) continue;

        const cid = extractCid(v.file?.ref);
        if (!cid) continue;

        const blobUrl = buildBlobUrl(PDS_ENDPOINT, did, cid);
        const existing = index.get(occurrenceRef) ?? {};
        index.set(occurrenceRef, { ...existing, [subjectPart]: blobUrl });
      }
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return index;
};
