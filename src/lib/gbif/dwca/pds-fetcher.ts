import { Agent } from "@atproto/api";

// ---------------------------------------------------------------------------
// Types imported from sibling writer modules (forward-declared here to avoid
// circular imports — the actual types are defined in those modules).
// ---------------------------------------------------------------------------

export type PdsOccurrenceRecord = {
  occurrenceID?: string;
  basisOfRecord?: string;
  scientificName?: string;
  vernacularName?: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  specificEpithet?: string;
  taxonRank?: string;
  eventDate?: string;
  decimalLatitude?: string;
  decimalLongitude?: string;
  geodeticDatum?: string;
  coordinateUncertaintyInMeters?: number;
  country?: string;
  countryCode?: string;
  stateProvince?: string;
  locality?: string;
  recordedBy?: string;
  datasetName?: string;
  institutionCode?: string;
  associatedMedia?: string;
  occurrenceRemarks?: string;
  dynamicProperties?: string;
  occurrenceStatus?: string;
  individualCount?: number;
  sex?: string;
  lifeStage?: string;
  habitat?: string;
  samplingProtocol?: string;
  /** AT-URI of this record — used to build the occurrenceUriToId map */
  _uri?: string;
  /** AT-URI of the site this occurrence belongs to */
  siteRef?: string;
};

export type PdsMeasurementRecord = {
  /** AT-URI of the linked dwc.occurrence record */
  occurrenceRef?: string;
  /** Cross-system ID duplicated from occurrence (fallback if occurrenceRef is missing) */
  occurrenceID?: string;
  measurementID?: string;
  measurementType?: string;
  measurementValue?: string;
  measurementUnit?: string;
  measurementAccuracy?: string;
  measurementDeterminedBy?: string;
  measurementDeterminedDate?: string;
  measurementMethod?: string;
  measurementRemarks?: string;
};

export type PdsMultimediaRecord = {
  /** AT-URI of the linked dwc.occurrence record */
  occurrenceRef?: string;
  /** Audubon Core subjectPart */
  subjectPart?: string;
  /** PDS blob reference */
  file?: { ref?: { $link?: string } | string; mimeType?: string };
  /** External URL to original full-res media */
  accessUri?: string;
  /** MIME type */
  format?: string;
  /** Human-readable caption */
  caption?: string;
  /** Creator name */
  creator?: string;
  /** ISO datetime when media was captured */
  createDate?: string;
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type DwcaFetchResult = {
  occurrences: PdsOccurrenceRecord[];
  measurements: PdsMeasurementRecord[];
  multimedia: PdsMultimediaRecord[];
  /** Map from occurrence AT-URI to occurrenceID string */
  occurrenceUriToId: Map<string, string>;
  /** Organization DID */
  orgDid: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Paginates through all records in a given ATProto collection, returning the
 * raw record list. Returns an empty array if the collection does not exist or
 * any fetch error occurs (so a missing collection doesn't abort the whole run).
 */
async function fetchAllRecords(
  agent: Agent,
  repo: string,
  collection: string
): Promise<{ uri: string; value: Record<string, unknown> }[]> {
  const records: { uri: string; value: Record<string, unknown> }[] = [];
  let cursor: string | undefined = undefined;

  try {
    do {
      const response = await agent.com.atproto.repo.listRecords({
        repo,
        collection,
        limit: 100,
        cursor,
      });

      for (const record of response.data.records) {
        records.push({
          uri: record.uri,
          value: record.value as Record<string, unknown>,
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

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchDwcaRecords(options: {
  /** PDS service URL, e.g. 'https://climateai.org' */
  pdsEndpoint: string;
  /** Organization handle (e.g. 'bees-and-trees-uga.climateai.org') or DID */
  orgIdentifier: string;
  /** Optional: filter occurrences to a specific site AT-URI */
  siteRef?: string;
  /** Optional: filter occurrences to measuredTree only */
  measuredTreesOnly?: boolean;
}): Promise<DwcaFetchResult> {
  const { pdsEndpoint, orgIdentifier, siteRef, measuredTreesOnly } = options;

  // 1. Create a fresh unauthenticated agent for this endpoint
  const agent = new Agent(pdsEndpoint);

  // 2. Resolve identifier to DID
  let orgDid: string;
  if (orgIdentifier.startsWith("did:")) {
    orgDid = orgIdentifier;
  } else {
    try {
      const resolved = await agent.resolveHandle({ handle: orgIdentifier });
      orgDid = resolved.data.did;
    } catch {
      throw new Error(`Could not resolve handle: ${orgIdentifier}`);
    }
  }

  // 3. Fetch all three collections in parallel
  const [rawOccurrences, rawMeasurements, rawMultimedia] = await Promise.all([
    fetchAllRecords(agent, orgDid, "app.gainforest.dwc.occurrence"),
    fetchAllRecords(agent, orgDid, "app.gainforest.dwc.measurement"),
    fetchAllRecords(agent, orgDid, "app.gainforest.ac.multimedia"),
  ]);

  // 4. Map occurrences
  const occurrenceUriToId = new Map<string, string>();
  let occurrences: PdsOccurrenceRecord[] = rawOccurrences.map((record) => {
    const v = record.value;
    const mapped: PdsOccurrenceRecord = {
      occurrenceID: v.occurrenceID as string | undefined,
      basisOfRecord: v.basisOfRecord as string | undefined,
      scientificName: v.scientificName as string | undefined,
      vernacularName: v.vernacularName as string | undefined,
      kingdom: v.kingdom as string | undefined,
      phylum: v.phylum as string | undefined,
      class: v.class as string | undefined,
      order: v.order as string | undefined,
      family: v.family as string | undefined,
      genus: v.genus as string | undefined,
      specificEpithet: v.specificEpithet as string | undefined,
      taxonRank: v.taxonRank as string | undefined,
      eventDate: v.eventDate as string | undefined,
      decimalLatitude: v.decimalLatitude as string | undefined,
      decimalLongitude: v.decimalLongitude as string | undefined,
      geodeticDatum: v.geodeticDatum as string | undefined,
      coordinateUncertaintyInMeters:
        v.coordinateUncertaintyInMeters as number | undefined,
      country: v.country as string | undefined,
      countryCode: v.countryCode as string | undefined,
      stateProvince: v.stateProvince as string | undefined,
      locality: v.locality as string | undefined,
      recordedBy: v.recordedBy as string | undefined,
      datasetName: v.datasetName as string | undefined,
      institutionCode: v.institutionCode as string | undefined,
      associatedMedia: v.associatedMedia as string | undefined,
      occurrenceRemarks: v.occurrenceRemarks as string | undefined,
      dynamicProperties: v.dynamicProperties as string | undefined,
      occurrenceStatus: v.occurrenceStatus as string | undefined,
      individualCount: v.individualCount as number | undefined,
      sex: v.sex as string | undefined,
      lifeStage: v.lifeStage as string | undefined,
      habitat: v.habitat as string | undefined,
      samplingProtocol: v.samplingProtocol as string | undefined,
      _uri: record.uri,
      siteRef: v.siteRef as string | undefined,
    };

    // Build the URI → occurrenceID map
    const occId = mapped.occurrenceID ?? record.uri;
    occurrenceUriToId.set(record.uri, occId);

    return mapped;
  });

  // Apply siteRef filter
  if (siteRef !== undefined) {
    occurrences = occurrences.filter((occ) => occ.siteRef === siteRef);
  }

  // Apply measuredTreesOnly filter
  if (measuredTreesOnly) {
    occurrences = occurrences.filter((occ) => {
      if (occ.basisOfRecord !== "HumanObservation") return false;
      if (!occ.dynamicProperties) return false;
      try {
        const parsed = JSON.parse(occ.dynamicProperties) as {
          dataType?: string;
        };
        return parsed.dataType === "measuredTree";
      } catch {
        return false;
      }
    });
  }

  // 5. Map measurements
  const measurements: PdsMeasurementRecord[] = rawMeasurements.map(
    (record) => {
      const v = record.value;
      return {
        occurrenceRef: v.occurrenceRef as string | undefined,
        occurrenceID: v.occurrenceID as string | undefined,
        measurementID: v.measurementID as string | undefined,
        measurementType: v.measurementType as string | undefined,
        measurementValue: v.measurementValue as string | undefined,
        measurementUnit: v.measurementUnit as string | undefined,
        measurementAccuracy: v.measurementAccuracy as string | undefined,
        measurementDeterminedBy: v.measurementDeterminedBy as
          | string
          | undefined,
        measurementDeterminedDate: v.measurementDeterminedDate as
          | string
          | undefined,
        measurementMethod: v.measurementMethod as string | undefined,
        measurementRemarks: v.measurementRemarks as string | undefined,
      };
    }
  );

  // 6. Map multimedia — handle blob ref nested structure
  const multimedia: PdsMultimediaRecord[] = rawMultimedia.map((record) => {
    const v = record.value;

    // Blob ref can be: { ref: { $link: string } | string, mimeType: string }
    let file: PdsMultimediaRecord["file"] | undefined;
    if (v.file && typeof v.file === "object") {
      const rawFile = v.file as Record<string, unknown>;
      const rawRef = rawFile.ref;
      let ref: { $link?: string } | string | undefined;
      if (typeof rawRef === "string") {
        ref = rawRef;
      } else if (rawRef && typeof rawRef === "object") {
        ref = rawRef as { $link?: string };
      }
      file = {
        ref,
        mimeType: rawFile.mimeType as string | undefined,
      };
    }

    return {
      occurrenceRef: v.occurrenceRef as string | undefined,
      subjectPart: v.subjectPart as string | undefined,
      file,
      accessUri: v.accessUri as string | undefined,
      format: v.format as string | undefined,
      caption: v.caption as string | undefined,
      creator: v.creator as string | undefined,
      createDate: v.createDate as string | undefined,
    };
  });

  console.log(
    `Fetched ${occurrences.length} occurrences, ${measurements.length} measurements, ${multimedia.length} multimedia for ${orgIdentifier}`
  );

  return {
    occurrences,
    measurements,
    multimedia,
    occurrenceUriToId,
    orgDid,
  };
}
