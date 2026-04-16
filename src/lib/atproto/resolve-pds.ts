import { PDS_ENDPOINT } from "@/config/atproto";

const cache = new Map<string, Promise<string>>();

type PlcService = {
  id?: string;
  type?: string;
  serviceEndpoint?: string;
};

/**
 * Resolve a DID to its home PDS endpoint.
 *
 * The app's singleton `ClimateAIAgent` points at a fixed PDS, but records for
 * external orgs (e.g. Bumicerts-certified trees on `gainforest.id`) live on
 * different PDSes. Using the wrong endpoint makes `getRecord`/`listRecords`
 * return RecordNotFound and produces silent empty fetches.
 *
 * This helper looks up the DID document and returns the AtprotoPersonalDataServer
 * service endpoint. Falls back to the configured default on any failure.
 */
export const resolvePdsEndpoint = async (did: string): Promise<string> => {
  const cached = cache.get(did);
  if (cached) return cached;

  const promise = (async (): Promise<string> => {
    try {
      if (did.startsWith("did:plc:")) {
        const res = await fetch(
          `https://plc.directory/${encodeURIComponent(did)}`,
        );
        if (!res.ok) {
          throw new Error(`plc.directory ${res.status}`);
        }
        const doc = (await res.json()) as { service?: PlcService[] };
        const services = Array.isArray(doc.service) ? doc.service : [];
        const pds = services.find(
          (s) =>
            s.type === "AtprotoPersonalDataServer" &&
            typeof s.serviceEndpoint === "string",
        );
        if (pds?.serviceEndpoint) {
          if (process.env.NODE_ENV === "development") {
            console.info(
              "[GG] resolved PDS for",
              did,
              "→",
              pds.serviceEndpoint,
            );
          }
          return pds.serviceEndpoint;
        }
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[GG] PDS resolution failed for", did, err);
      }
    }
    return PDS_ENDPOINT;
  })();

  cache.set(did, promise);
  return promise;
};
