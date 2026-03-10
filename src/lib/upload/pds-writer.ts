import type { Agent } from "@atproto/api";
import { TID } from "@atproto/common-web";

import type { MeasurementInput, OccurrenceInput } from "@/lib/upload/types";

const DWC_OCCURRENCE_COLLECTION = "app.gainforest.dwc.occurrence";
const DWC_MEASUREMENT_COLLECTION = "app.gainforest.dwc.measurement";

/**
 * Write a single dwc.occurrence record to the ATProto PDS.
 *
 * @param agent - Authenticated ATProto Agent
 * @param did - The DID of the repo to write to
 * @param occurrence - Validated occurrence input data
 * @param projectRef - Optional AT-URI reference to the project record
 * @returns The URI and rkey of the created record
 */
export async function writeOccurrenceToPds(
  agent: Agent,
  did: string,
  occurrence: OccurrenceInput,
  projectRef?: string
): Promise<{ uri: string; rkey: string }> {
  const rkey = TID.nextStr();

  const record: Record<string, unknown> = {
    basisOfRecord: occurrence.basisOfRecord ?? "HumanObservation",
    scientificName: occurrence.scientificName,
    eventDate: occurrence.eventDate,
    decimalLatitude: String(occurrence.decimalLatitude),
    decimalLongitude: String(occurrence.decimalLongitude),
    geodeticDatum: "EPSG:4326",
    kingdom: occurrence.kingdom ?? "Plantae",
    license: "http://creativecommons.org/licenses/by/4.0/",
    occurrenceID: crypto.randomUUID(),
    occurrenceStatus: "present",
    createdAt: new Date().toISOString(),
  };

  // Optional fields — only include if defined and non-empty
  if (occurrence.vernacularName) {
    record.vernacularName = occurrence.vernacularName;
  }
  if (occurrence.recordedBy) {
    record.recordedBy = occurrence.recordedBy;
  }
  if (occurrence.locality) {
    record.locality = occurrence.locality;
  }
  if (occurrence.country) {
    record.country = occurrence.country;
  }
  if (occurrence.countryCode) {
    record.countryCode = occurrence.countryCode;
  }
  if (occurrence.occurrenceRemarks) {
    record.occurrenceRemarks = occurrence.occurrenceRemarks;
  }
  if (occurrence.habitat) {
    record.habitat = occurrence.habitat;
  }
  if (occurrence.samplingProtocol) {
    record.samplingProtocol = occurrence.samplingProtocol;
  }
  if (projectRef) {
    record.projectRef = projectRef;
  }

  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: DWC_OCCURRENCE_COLLECTION,
    rkey,
    record,
  });

  return { uri: response.data.uri, rkey };
}

/**
 * Write dwc.measurement records linked to an occurrence to the ATProto PDS.
 *
 * @param agent - Authenticated ATProto Agent
 * @param did - The DID of the repo to write to
 * @param occurrenceUri - AT-URI of the parent occurrence record
 * @param measurements - Array of validated measurement inputs
 * @returns Array of objects with the URI and measurement type for each written record
 */
export async function writeMeasurementsToPds(
  agent: Agent,
  did: string,
  occurrenceUri: string,
  measurements: MeasurementInput[]
): Promise<{ uri: string; type: string }[]> {
  const results: { uri: string; type: string }[] = [];

  for (const measurement of measurements) {
    const rkey = TID.nextStr();

    const record: Record<string, unknown> = {
      occurrenceRef: occurrenceUri,
      measurementType: measurement.measurementType,
      measurementValue: measurement.measurementValue,
      measurementID: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    // Optional fields — only include if defined and non-empty
    if (measurement.measurementUnit) {
      record.measurementUnit = measurement.measurementUnit;
    }
    if (measurement.measurementMethod) {
      record.measurementMethod = measurement.measurementMethod;
    }

    const response = await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: DWC_MEASUREMENT_COLLECTION,
      rkey,
      record,
    });

    results.push({ uri: response.data.uri, type: measurement.measurementType });
  }

  return results;
}

/**
 * Convenience function: write a tree record (occurrence + measurements) to the PDS.
 *
 * @param agent - Authenticated ATProto Agent
 * @param did - The DID of the repo to write to
 * @param row - Object containing occurrence and measurements data
 * @param projectRef - Optional AT-URI reference to the project record
 * @returns The occurrence URI and all measurement URIs
 */
export async function writeTreeRecord(
  agent: Agent,
  did: string,
  row: { occurrence: OccurrenceInput; measurements: MeasurementInput[] },
  projectRef?: string
): Promise<{ occurrenceUri: string; measurementUris: string[] }> {
  const { uri: occurrenceUri } = await writeOccurrenceToPds(
    agent,
    did,
    row.occurrence,
    projectRef
  );

  const measurementResults = await writeMeasurementsToPds(
    agent,
    did,
    occurrenceUri,
    row.measurements
  );

  const measurementUris = measurementResults.map((r) => r.uri);

  return { occurrenceUri, measurementUris };
}
