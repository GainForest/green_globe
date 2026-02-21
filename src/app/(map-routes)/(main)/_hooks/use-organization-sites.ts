"use client";

import { useQuery } from "@tanstack/react-query";
import ClimateAIAgent from "@/lib/atproto/agent";

const SITE_COLLECTION = "app.gainforest.organization.site";
const DEFAULT_SITE_COLLECTION = "app.gainforest.organization.defaultSite";
const DEFAULT_SITE_RKEY = "self";

export type SiteRecord = {
  uri: string;
  rkey: string;
  name: string;
  lat: string;
  lon: string;
  area: string;
  shapefile: unknown;
  trees?: unknown;
  createdAt?: string;
};

type RawSiteValue = {
  name?: unknown;
  lat?: unknown;
  lon?: unknown;
  area?: unknown;
  shapefile?: unknown;
  trees?: unknown;
  createdAt?: unknown;
  [k: string]: unknown;
};

type RawSiteRecord = {
  uri: string;
  cid: string;
  value: RawSiteValue;
};

const extractRkey = (uri: string): string => {
  const parts = uri.split("/");
  return parts[parts.length - 1] ?? uri;
};

const normalizeSiteRecord = (raw: RawSiteRecord): SiteRecord => ({
  uri: raw.uri,
  rkey: extractRkey(raw.uri),
  name: typeof raw.value.name === "string" ? raw.value.name : "",
  lat: typeof raw.value.lat === "string" ? raw.value.lat : "",
  lon: typeof raw.value.lon === "string" ? raw.value.lon : "",
  area: typeof raw.value.area === "string" ? raw.value.area : "",
  shapefile: raw.value.shapefile ?? null,
  trees: raw.value.trees,
  createdAt:
    typeof raw.value.createdAt === "string" ? raw.value.createdAt : undefined,
});

const fetchAllSiteRecords = async (did: string): Promise<SiteRecord[]> => {
  const records: SiteRecord[] = [];
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: SITE_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawSiteRecord[] | undefined;
    if (page?.length) {
      records.push(...page.map(normalizeSiteRecord));
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return records;
};

const fetchDefaultSiteUri = async (did: string): Promise<string | null> => {
  try {
    const response = await ClimateAIAgent.com.atproto.repo.getRecord({
      repo: did,
      collection: DEFAULT_SITE_COLLECTION,
      rkey: DEFAULT_SITE_RKEY,
    });

    const value = response.data.value as { site?: unknown } | undefined;
    if (typeof value?.site === "string") {
      return value.site;
    }
    return null;
  } catch {
    // No defaultSite record exists for this org — that's fine
    return null;
  }
};

type UseOrganizationSitesResult = {
  sites: SiteRecord[];
  defaultSiteUri: string | null;
  isLoading: boolean;
  error: Error | null;
};

const useOrganizationSites = (did: string | null | undefined): UseOrganizationSitesResult => {
  const sitesQuery = useQuery({
    queryKey: ["organization-sites", did],
    queryFn: async () => {
      if (!did) return [];
      return fetchAllSiteRecords(did);
    },
    enabled: Boolean(did),
  });

  const defaultSiteQuery = useQuery({
    queryKey: ["organization-default-site", did],
    queryFn: async () => {
      if (!did) return null;
      return fetchDefaultSiteUri(did);
    },
    enabled: Boolean(did),
  });

  const isLoading = sitesQuery.isLoading || defaultSiteQuery.isLoading;
  const error =
    (sitesQuery.error as Error | null) ??
    (defaultSiteQuery.error as Error | null);

  return {
    sites: sitesQuery.data ?? [],
    defaultSiteUri: defaultSiteQuery.data ?? null,
    isLoading,
    error,
  };
};

export default useOrganizationSites;
