import type { Agent } from "@atproto/api";
import { TID } from "@atproto/common-web";

import type {
  FloraMeasurementBundle,
  MeasurementInput,
  OccurrenceInput,
} from "@/lib/upload/types";
import { normalizeOccurrenceEventDate } from "@/lib/occurrence-event-date";

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
  const normalizedEventDate = normalizeOccurrenceEventDate(occurrence.eventDate);

  if (!normalizedEventDate) {
    throw new Error(
      "Occurrence eventDate must be a valid, unambiguous date before writing to the PDS",
    );
  }

  const record: Record<string, unknown> = {
    basisOfRecord: occurrence.basisOfRecord ?? "HumanObservation",
    scientificName: occurrence.scientificName,
    eventDate: normalizedEventDate,
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
 * @deprecated Use writeMeasurementBundleToPds instead. Kept for migration script use.
 *
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
 * Write a single bundled dwc.measurement record linked to an occurrence to the ATProto PDS.
 * All flora measurements for the occurrence are stored in one record using the
 * `app.gainforest.dwc.measurement#floraMeasurement` union type.
 *
 * @param agent - Authenticated ATProto Agent
 * @param did - The DID of the repo to write to
 * @param occurrenceUri - AT-URI of the parent occurrence record
 * @param floraMeasurement - Bundled flora measurement data
 * @returns The URI of the created record
 */
export async function writeMeasurementBundleToPds(
  agent: Agent,
  did: string,
  occurrenceUri: string,
  floraMeasurement: FloraMeasurementBundle
): Promise<{ uri: string }> {
  const rkey = TID.nextStr();

  // Build the result union object — only include fields that are defined and non-empty
  const result: Record<string, unknown> = {
    $type: "app.gainforest.dwc.measurement#floraMeasurement",
  };

  if (floraMeasurement.dbh) {
    result.dbh = floraMeasurement.dbh;
  }
  if (floraMeasurement.totalHeight) {
    result.totalHeight = floraMeasurement.totalHeight;
  }
  if (floraMeasurement.diameter) {
    result.basalDiameter = floraMeasurement.diameter;
  }
  if (floraMeasurement.canopyCoverPercent) {
    result.canopyCoverPercent = floraMeasurement.canopyCoverPercent;
  }

  const record: Record<string, unknown> = {
    occurrenceRef: occurrenceUri,
    result,
    createdAt: new Date().toISOString(),
  };

  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: DWC_MEASUREMENT_COLLECTION,
    rkey,
    record,
  });

  return { uri: response.data.uri };
}

/**
 * Convenience function: write a tree record (occurrence + optional bundled measurement) to the PDS.
 *
 * @param agent - Authenticated ATProto Agent
 * @param did - The DID of the repo to write to
 * @param row - Object containing occurrence and optional flora measurement bundle
 * @param projectRef - Optional AT-URI reference to the project record
 * @returns The occurrence URI and the measurement URI (or null if no measurements)
 */
export async function writeTreeRecord(
  agent: Agent,
  did: string,
  row: { occurrence: OccurrenceInput; floraMeasurement: FloraMeasurementBundle | null },
  projectRef?: string
): Promise<{ occurrenceUri: string; measurementUri: string | null }> {
  const { uri: occurrenceUri } = await writeOccurrenceToPds(
    agent,
    did,
    row.occurrence,
    projectRef
  );

  if (!row.floraMeasurement) {
    return { occurrenceUri, measurementUri: null };
  }

  const { uri: measurementUri } = await writeMeasurementBundleToPds(
    agent,
    did,
    occurrenceUri,
    row.floraMeasurement
  );

  return { occurrenceUri, measurementUri };
}
