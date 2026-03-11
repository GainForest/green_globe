import { Agent } from "@atproto/api";
import { TID } from "@atproto/common-web";
import { PDS_ENDPOINT } from "@/config/atproto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GbifDatasetRecord = {
  uri: string;
  rkey: string;
  organizationRef: string;
  gbifDatasetKey: string;
  gbifInstallationKey: string;
  gbifEndpointKey?: number;
  datasetTitle?: string;
  archiveBlobCid?: string;
  lastPublishedAt?: string;
  lastCrawlFinishReason?: string;
  createdAt: string;
};

export type GbifDatasetRecordInput = Omit<GbifDatasetRecord, "uri" | "rkey">;

// ---------------------------------------------------------------------------
// Collection constant
// ---------------------------------------------------------------------------

const COLLECTION = "app.gainforest.gbif.dataset";

// ---------------------------------------------------------------------------
// CRUD functions
// ---------------------------------------------------------------------------

/**
 * Create a new GBIF dataset record in the PDS.
 * Generates a TID rkey and calls putRecord.
 * The agent must have an active session (authenticated).
 */
export async function createGbifDatasetRecord(
  agent: Agent,
  did: string,
  data: GbifDatasetRecordInput
): Promise<{ uri: string; rkey: string }> {
  const rkey = TID.nextStr();

  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: COLLECTION,
    rkey,
    record: {
      $type: COLLECTION,
      organizationRef: data.organizationRef,
      gbifDatasetKey: data.gbifDatasetKey,
      gbifInstallationKey: data.gbifInstallationKey,
      ...(data.gbifEndpointKey !== undefined && {
        gbifEndpointKey: data.gbifEndpointKey,
      }),
      ...(data.datasetTitle !== undefined && { datasetTitle: data.datasetTitle }),
      ...(data.archiveBlobCid !== undefined && {
        archiveBlobCid: data.archiveBlobCid,
      }),
      ...(data.lastPublishedAt !== undefined && {
        lastPublishedAt: data.lastPublishedAt,
      }),
      ...(data.lastCrawlFinishReason !== undefined && {
        lastCrawlFinishReason: data.lastCrawlFinishReason,
      }),
      createdAt: data.createdAt,
    },
  });

  return { uri: response.data.uri, rkey };
}

/**
 * Get a single GBIF dataset record by rkey.
 * Returns null if the record is not found.
 * The agent must have an active session (authenticated).
 */
export async function getGbifDatasetRecord(
  agent: Agent,
  did: string,
  rkey: string
): Promise<GbifDatasetRecord | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: COLLECTION,
      rkey,
    });

    const v = response.data.value as Record<string, unknown>;

    return {
      uri: response.data.uri,
      rkey,
      organizationRef: v.organizationRef as string,
      gbifDatasetKey: v.gbifDatasetKey as string,
      gbifInstallationKey: v.gbifInstallationKey as string,
      gbifEndpointKey: v.gbifEndpointKey as number | undefined,
      datasetTitle: v.datasetTitle as string | undefined,
      archiveBlobCid: v.archiveBlobCid as string | undefined,
      lastPublishedAt: v.lastPublishedAt as string | undefined,
      lastCrawlFinishReason: v.lastCrawlFinishReason as string | undefined,
      createdAt: v.createdAt as string,
    };
  } catch {
    // Record not found (404) or other error — return null
    return null;
  }
}

/**
 * Update an existing GBIF dataset record by merging new data into the existing record.
 * The agent must have an active session (authenticated).
 */
export async function updateGbifDatasetRecord(
  agent: Agent,
  did: string,
  rkey: string,
  data: Partial<GbifDatasetRecordInput>
): Promise<void> {
  const existing = await getGbifDatasetRecord(agent, did, rkey);
  if (!existing) {
    throw new Error(
      `GBIF dataset record not found: repo=${did}, rkey=${rkey}`
    );
  }

  const merged: GbifDatasetRecordInput = {
    organizationRef: data.organizationRef ?? existing.organizationRef,
    gbifDatasetKey: data.gbifDatasetKey ?? existing.gbifDatasetKey,
    gbifInstallationKey:
      data.gbifInstallationKey ?? existing.gbifInstallationKey,
    gbifEndpointKey:
      data.gbifEndpointKey !== undefined
        ? data.gbifEndpointKey
        : existing.gbifEndpointKey,
    datasetTitle:
      data.datasetTitle !== undefined ? data.datasetTitle : existing.datasetTitle,
    archiveBlobCid:
      data.archiveBlobCid !== undefined
        ? data.archiveBlobCid
        : existing.archiveBlobCid,
    lastPublishedAt:
      data.lastPublishedAt !== undefined
        ? data.lastPublishedAt
        : existing.lastPublishedAt,
    lastCrawlFinishReason:
      data.lastCrawlFinishReason !== undefined
        ? data.lastCrawlFinishReason
        : existing.lastCrawlFinishReason,
    createdAt: existing.createdAt,
  };

  await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: COLLECTION,
    rkey,
    record: {
      $type: COLLECTION,
      organizationRef: merged.organizationRef,
      gbifDatasetKey: merged.gbifDatasetKey,
      gbifInstallationKey: merged.gbifInstallationKey,
      ...(merged.gbifEndpointKey !== undefined && {
        gbifEndpointKey: merged.gbifEndpointKey,
      }),
      ...(merged.datasetTitle !== undefined && {
        datasetTitle: merged.datasetTitle,
      }),
      ...(merged.archiveBlobCid !== undefined && {
        archiveBlobCid: merged.archiveBlobCid,
      }),
      ...(merged.lastPublishedAt !== undefined && {
        lastPublishedAt: merged.lastPublishedAt,
      }),
      ...(merged.lastCrawlFinishReason !== undefined && {
        lastCrawlFinishReason: merged.lastCrawlFinishReason,
      }),
      createdAt: merged.createdAt,
    },
  });
}

/**
 * List all GBIF dataset records for a given DID.
 * Uses unauthenticated fetch via the public PDS endpoint (same pattern as pds-fetcher.ts).
 */
export async function listGbifDatasetRecords(
  did: string
): Promise<GbifDatasetRecord[]> {
  const agent = new Agent(PDS_ENDPOINT);
  const records: GbifDatasetRecord[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const response = await agent.com.atproto.repo.listRecords({
        repo: did,
        collection: COLLECTION,
        limit: 100,
        cursor,
      });

      for (const record of response.data.records) {
        const v = record.value as Record<string, unknown>;
        const uriParts = record.uri.split("/");
        const rkey = uriParts[uriParts.length - 1] ?? "";

        records.push({
          uri: record.uri,
          rkey,
          organizationRef: v.organizationRef as string,
          gbifDatasetKey: v.gbifDatasetKey as string,
          gbifInstallationKey: v.gbifInstallationKey as string,
          gbifEndpointKey: v.gbifEndpointKey as number | undefined,
          datasetTitle: v.datasetTitle as string | undefined,
          archiveBlobCid: v.archiveBlobCid as string | undefined,
          lastPublishedAt: v.lastPublishedAt as string | undefined,
          lastCrawlFinishReason: v.lastCrawlFinishReason as string | undefined,
          createdAt: v.createdAt as string,
        });
      }

      cursor = response.data.cursor;
    } while (cursor);
  } catch {
    // Collection may not exist (404) or other transient error — return empty
    return [];
  }

  return records;
}

/**
 * Find a GBIF dataset record by its GBIF dataset key.
 * Lists all records for the DID and filters by gbifDatasetKey match.
 * Returns null if no matching record is found.
 */
export async function findByGbifDatasetKey(
  did: string,
  gbifDatasetKey: string
): Promise<GbifDatasetRecord | null> {
  const records = await listGbifDatasetRecords(did);
  return records.find((r) => r.gbifDatasetKey === gbifDatasetKey) ?? null;
}

/**
 * Find a GBIF dataset record by the AT-URI of the organization it belongs to.
 * Lists all records for the DID and filters by organizationRef match.
 * Returns null if no matching record is found.
 *
 * Use this to check whether an organization already has a registered GBIF
 * dataset before deciding to create a new one vs. updating the existing one.
 */
export async function findByOrganizationRef(
  did: string,
  organizationRef: string
): Promise<GbifDatasetRecord | null> {
  const records = await listGbifDatasetRecords(did);
  return records.find((r) => r.organizationRef === organizationRef) ?? null;
}
