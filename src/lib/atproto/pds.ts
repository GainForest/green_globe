import { Agent } from "@atproto/api";
import type { ValidationResult } from "@atproto/lexicon";
import { buildBlobUrl } from "@/lib/atproto/extract-cid";
import {
  normalizePdsEndpoint,
  resolvePdsEndpoint,
} from "@/lib/atproto/resolve-pds";

const agentsByEndpoint = new Map<string, Agent>();

export const agentForPdsEndpoint = (pdsEndpoint: string): Agent => {
  const endpoint = normalizePdsEndpoint(pdsEndpoint);
  const cached = agentsByEndpoint.get(endpoint);
  if (cached) return cached;

  const agent = new Agent(endpoint);
  agentsByEndpoint.set(endpoint, agent);
  return agent;
};

/**
 * Return an unauthenticated ATProto agent that talks to the DID's current PDS.
 */
export const agentForDid = async (did: string): Promise<Agent> => {
  const pdsEndpoint = await resolvePdsEndpoint(did);
  return agentForPdsEndpoint(pdsEndpoint);
};

export const pdsEndpointForDid = resolvePdsEndpoint;

export const blobUrlForDid = async (
  did: string,
  cid: string,
): Promise<string> => {
  const pdsEndpoint = await resolvePdsEndpoint(did);
  return buildBlobUrl(pdsEndpoint, did, cid);
};

export const getRecordForDid = async <V>(
  did: string,
  collection: string,
  rkey: string,
  validationFn?: (v: V) => ValidationResult<V>,
): Promise<V> => {
  const agent = await agentForDid(did);
  const data = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection,
    rkey,
  });

  if (!data.success) throw new Error("Failed to fetch record");
  if (!validationFn) return data.data.value as V;

  const validation = validationFn(data.data.value as V);
  if (!validation.success) {
    throw new Error(
      `Record fetched but validation failed: ${validation.error.message}`,
    );
  }
  return validation.value;
};

export const listRecordsForDid = async <TRecord>(
  did: string,
  collection: string,
  limit = 100,
): Promise<TRecord[]> => {
  const agent = await agentForDid(did);
  const records: TRecord[] = [];
  let cursor: string | undefined;

  do {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection,
      limit,
      cursor,
    });

    const page = response.data.records as TRecord[] | undefined;
    if (page?.length) {
      records.push(...page);
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return records;
};
