import type { HyperindexMeasurementNode, HyperindexOccurrenceNode } from './types';

/**
 * Maps a Hyperindex occurrence node to the RawOccurrenceRecord shape used by
 * normalizePlantRecord, normalizeAnimalRecord, and measured-tree mapping code.
 *
 * cid is always '' — Hyperindex doesn't return CID and it is never read by
 * normalization code.
 */
export function toRawOccurrenceRecord(node: HyperindexOccurrenceNode): {
  uri: string;
  cid: string;
  value: {
    kingdom?: unknown;
    scientificName?: unknown;
    vernacularName?: unknown;
    basisOfRecord?: unknown;
    decimalLatitude?: unknown;
    decimalLongitude?: unknown;
    dynamicProperties?: unknown;
    eventDate?: unknown;
    occurrenceID?: unknown;
    associatedMedia?: unknown;
    conservationStatus?: unknown;
    plantTraits?: unknown;
    imageEvidence?: { $type?: string; file?: { ref?: unknown; mimeType?: string } };
    siteRef?: unknown;
    speciesImageUrl?: unknown;
    thumbnailUrl?: unknown;
    [k: string]: unknown;
  };
} {
  return {
    uri: node.uri,
    cid: '',
    value: {
      kingdom: node.kingdom,
      scientificName: node.scientificName,
      vernacularName: node.vernacularName,
      basisOfRecord: node.basisOfRecord,
      decimalLatitude: node.decimalLatitude,
      decimalLongitude: node.decimalLongitude,
      dynamicProperties: node.dynamicProperties,
      eventDate: node.eventDate,
      occurrenceID: node.occurrenceID,
      associatedMedia: node.associatedMedia,
      conservationStatus: null,
      plantTraits: null,
      imageEvidence: node.imageEvidence ?? undefined,
      siteRef: null,
    },
  };
}

/**
 * Maps a Hyperindex measurement node to the RawMeasurementRecord shape used by
 * use-organization-measured-trees.ts.
 *
 * cid is always '' — Hyperindex doesn't return CID and it is never read by
 * normalization code.
 *
 * result is always undefined — Hyperindex exposes the old per-measurement format
 * (measurementType/measurementValue at top level). The existing fetchMeasurementIndex
 * code already handles this format correctly.
 */
export function toRawMeasurementRecord(node: HyperindexMeasurementNode): {
  uri: string;
  cid: string;
  value: {
    occurrenceRef?: unknown;
    measurementType?: unknown;
    measurementValue?: unknown;
    measurementUnit?: unknown;
    result?: unknown;
    [k: string]: unknown;
  };
} {
  return {
    uri: node.uri,
    cid: '',
    value: {
      occurrenceRef: node.occurrenceRef,
      measurementType: node.measurementType,
      measurementValue: node.measurementValue,
      measurementUnit: node.measurementUnit,
      result: undefined,
    },
  };
}
