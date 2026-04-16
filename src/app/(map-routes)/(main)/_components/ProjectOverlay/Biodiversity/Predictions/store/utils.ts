import { toKebabCase } from "@/lib/utils";
import type { BiodiversityTraits } from "./types";
import { BiodiversityAnimal, BiodiversityPlant } from "./types";
import * as d3 from "d3";
import { hyperindexClient } from "@/lib/hyperindex/client";
import { OCCURRENCES_BY_DID_AND_KINGDOM } from "@/lib/hyperindex/queries";
import type { Connection, HiDwcOccurrence } from "@/lib/hyperindex/types";
import { PDS_ENDPOINT } from "@/config/atproto";
import { extractCid, buildBlobUrl } from "@/lib/atproto/extract-cid";
import {
  fetchMultimediaIndex,
  type MultimediaIndex,
} from "@/lib/atproto/ac-multimedia";

// ── Raw record shapes ──────────────────────────────────────────────────────────

type RawConservationStatus = {
  $type?: string;
  iucnCategory?: unknown;
  iucnTaxonId?: unknown;
  [k: string]: unknown;
};

type RawPlantTraits = {
  $type?: string;
  woodDensity?: unknown;
  maxHeight?: unknown;
  stemDiameter?: unknown;
  stemConduitDiameter?: unknown;
  barkThickness?: unknown;
  rootDepth?: unknown;
  edibleParts?: unknown;
  [k: string]: unknown;
};

type RawOccurrenceValue = {
  kingdom?: unknown;
  scientificName?: unknown;
  vernacularName?: unknown;
  occurrenceID?: unknown;
  speciesImageUrl?: unknown;
  thumbnailUrl?: unknown;
  imageEvidence?: { $type?: string; file?: { ref?: unknown; mimeType?: string } };
  dynamicProperties?: unknown;
  conservationStatus?: unknown;
  plantTraits?: unknown;
  basisOfRecord?: unknown;
  [k: string]: unknown;
};

type RawOccurrenceRecord = {
  uri: string;
  cid?: string;
  value: RawOccurrenceValue;
};

type OccurrenceResponse = {
  appGainforestDwcOccurrence: Connection<HiDwcOccurrence>;
};

// ── Dynamic properties parsed from JSON string ─────────────────────────────────

type ParsedDynamicProperties = {
  group?: string;
  dataType?: string;
  animalType?: string;
  [k: string]: unknown;
};

const parseDynamicProperties = (
  raw: unknown,
): ParsedDynamicProperties | null => {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as ParsedDynamicProperties;
    }
    return null;
  } catch {
    return null;
  }
};

// ── Type guards ────────────────────────────────────────────────────────────────

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = parseFloat(value);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
};

// ── Mappers ────────────────────────────────────────────────────────────────────

const mapPlantTraits = (raw: unknown): BiodiversityTraits | undefined => {
  if (typeof raw !== "object" || raw === null) return undefined;
  const r = raw as RawPlantTraits;

  const woodDensity = toNumber(r.woodDensity);
  const treeHeight = toNumber(r.maxHeight);
  const stemDiameter = toNumber(r.stemDiameter);
  const stemConduitDiameter = toNumber(r.stemConduitDiameter);
  const barkThickness = toNumber(r.barkThickness);
  const rootDepth = toNumber(r.rootDepth);

  if (
    woodDensity === undefined &&
    treeHeight === undefined &&
    stemDiameter === undefined &&
    stemConduitDiameter === undefined &&
    barkThickness === undefined &&
    rootDepth === undefined
  ) {
    return undefined;
  }

  return {
    woodDensity: woodDensity ?? 0,
    treeHeight: treeHeight ?? 0,
    stemDiameter: stemDiameter ?? 0,
    stemConduitDiameter: stemConduitDiameter ?? 0,
    barkThickness: barkThickness ?? 0,
    rootDepth: rootDepth ?? 0,
  };
};

const mapConservationStatus = (
  raw: unknown,
): { iucnCategory?: string; iucnTaxonId?: number } => {
  if (typeof raw !== "object" || raw === null) return {};
  const r = raw as RawConservationStatus;
  return {
    iucnCategory:
      typeof r.iucnCategory === "string" ? r.iucnCategory : undefined,
    iucnTaxonId:
      typeof r.iucnTaxonId === "string"
        ? parseInt(r.iucnTaxonId, 10) || undefined
        : typeof r.iucnTaxonId === "number"
          ? r.iucnTaxonId
          : undefined,
  };
};

// Internal extended plant type that carries dataType for tree/herb splitting
type PlantWithDataType = BiodiversityPlant & { _dataType: string };

const normalizePlantRecord = (
  raw: RawOccurrenceRecord,
  did: string,
  multimediaIndex: MultimediaIndex,
  occurrenceUri: string,
): PlantWithDataType | null => {
  const v = raw.value;
  const scientificName =
    typeof v.scientificName === "string" ? v.scientificName : null;
  if (!scientificName) return null;

  const dynProps = parseDynamicProperties(v.dynamicProperties);
  const group = dynProps?.group ?? "COMMON";
  const dataType = dynProps?.dataType ?? "trees";

  const { iucnCategory, iucnTaxonId } = mapConservationStatus(
    v.conservationStatus,
  );
  const traits = mapPlantTraits(v.plantTraits);

  // Resolve image URL: prefer AC multimedia record, then imageEvidence blob, then placeholder.
  let imageUrl: string | undefined;
  const acBlobUrl = multimediaIndex.get(occurrenceUri);
  if (acBlobUrl) {
    imageUrl = acBlobUrl;
  } else {
    const imageEvidenceRef = v.imageEvidence?.file?.ref;
    const blobCid = extractCid(imageEvidenceRef);
    if (blobCid) {
      imageUrl = buildBlobUrl(PDS_ENDPOINT, did, blobCid);
    }
  }

  let edibleParts: string[] | undefined;
  if (
    typeof v.plantTraits === "object" &&
    v.plantTraits !== null &&
    isStringArray((v.plantTraits as RawPlantTraits).edibleParts)
  ) {
    edibleParts = (v.plantTraits as RawPlantTraits).edibleParts as string[];
  }

  const key =
    typeof v.occurrenceID === "string" && v.occurrenceID.trim() !== ""
      ? v.occurrenceID
      : scientificName.toLowerCase().replace(/\s+/g, "_");

  return {
    key,
    scientificName,
    commonName:
      typeof v.vernacularName === "string" ? v.vernacularName : undefined,
    group,
    iucnCategory,
    iucnTaxonId,
    traits,
    awsUrl: imageUrl,
    imageUrl,
    edibleParts,
    _dataType: dataType,
  };
};

const VALID_ANIMAL_TYPES = [
  "Reptile",
  "Amphibian",
  "Mammal",
  "Bird",
  "IUCN Red List",
] as const;
type AnimalType = (typeof VALID_ANIMAL_TYPES)[number];

const normalizeAnimalRecord = (
  raw: RawOccurrenceRecord,
): BiodiversityAnimal | null => {
  const v = raw.value;
  const scientificName =
    typeof v.scientificName === "string" ? v.scientificName : null;
  if (!scientificName) return null;

  const dynProps = parseDynamicProperties(v.dynamicProperties);
  const rawType = dynProps?.animalType ?? "";

  const animalType: AnimalType = (
    VALID_ANIMAL_TYPES as readonly string[]
  ).includes(rawType)
    ? (rawType as AnimalType)
    : "IUCN Red List";

  return {
    Species: scientificName,
    Type: animalType,
  };
};

// ── ATProto fetch functions (plain async, no React hooks) ──────────────────────

const mapOccurrenceNodeToRawRecord = (
  node: HiDwcOccurrence,
): RawOccurrenceRecord => ({
  uri: node.uri,
  cid: node.cid,
  value: {
    kingdom: node.kingdom,
    scientificName: node.scientificName,
    vernacularName: node.vernacularName,
    occurrenceID: node.occurrenceID,
    imageEvidence: node.imageEvidence,
    dynamicProperties: node.dynamicProperties,
    basisOfRecord: node.basisOfRecord,
    conservationStatus: node.conservationStatus,
    plantTraits: node.plantTraits,
  },
});

const fetchOccurrencesByKingdom = async (
  did: string,
  kingdom: "Plantae" | "Animalia",
): Promise<RawOccurrenceRecord[]> => {
  const records: RawOccurrenceRecord[] = [];
  let cursor: string | null = null;

  do {
    const response: OccurrenceResponse = await hyperindexClient.request(
      OCCURRENCES_BY_DID_AND_KINGDOM,
      {
        did,
        first: 100,
        after: cursor,
        kingdom,
      },
    );

    const connection = response.appGainforestDwcOccurrence;
    records.push(
      ...connection.edges.map((edge) => mapOccurrenceNodeToRawRecord(edge.node)),
    );

    cursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (cursor);

  return records;
};

/**
 * Fetch Plantae occurrence records from ATProto for a given org DID.
 * Returns { trees, herbs } split by dynamicProperties.dataType.
 * Returns null on error.
 */
export const fetchPlantsFromATProto = async (
  did: string,
): Promise<{ trees: BiodiversityPlant[]; herbs: BiodiversityPlant[] } | null> => {
  try {
    const trees: BiodiversityPlant[] = [];
    const herbs: BiodiversityPlant[] = [];

    const [multimediaIndex, occurrences] = await Promise.all([
      fetchMultimediaIndex(did),
      fetchOccurrencesByKingdom(did, "Plantae"),
    ]);

    for (const record of occurrences) {
      const basisOfRecord =
        typeof record.value.basisOfRecord === "string"
          ? record.value.basisOfRecord
          : undefined;
      if (basisOfRecord === "HumanObservation") continue;

      const plant = normalizePlantRecord(
        record,
        did,
        multimediaIndex,
        record.uri,
      );
      if (plant) {
        const { _dataType, ...plantData } = plant;
        if (_dataType === "herbs") {
          herbs.push(plantData);
        } else {
          trees.push(plantData);
        }
      }
    }

    return { trees, herbs };
  } catch (e) {
    console.error("fetchPlantsFromATProto error:", e);
    return null;
  }
};

/**
 * Fetch Animalia occurrence records from ATProto for a given org DID.
 * Returns BiodiversityAnimal[] or null on error.
 */
export const fetchAnimalsFromATProto = async (
  did: string,
): Promise<BiodiversityAnimal[] | null> => {
  try {
    const animals: BiodiversityAnimal[] = [];
    const occurrences = await fetchOccurrencesByKingdom(did, "Animalia");

    for (const record of occurrences) {
      const animal = normalizeAnimalRecord(record);
      if (animal) animals.push(animal);
    }

    return animals;
  } catch (e) {
    console.error("fetchAnimalsFromATProto error:", e);
    return null;
  }
};

// ── S3 fallback fetch functions ────────────────────────────────────────────────

export const fetchPlantsData = async (
  projectName: string,
  type: "Trees" | "Herbs"
) => {
  const kebabCasedProjectName = toKebabCase(projectName);
  try {
    const filename = `${kebabCasedProjectName}-${type.toLowerCase()}.json`;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/restor/${filename}`
    );
    const data: { items: BiodiversityPlant[] } = await response.json();
    const hasImage = (obj: BiodiversityPlant) =>
      obj.awsUrl && obj.awsUrl.trim() !== "";
    const sortedData = data.items.sort((a, b) => {
      if (hasImage(a) === hasImage(b)) {
        return 0;
      }
      return hasImage(a) ? -1 : 1;
    });
    return {
      items: sortedData,
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchAnimalsData = async (projectName: string) => {
  const kebabCasedProjectName = toKebabCase(projectName);
  try {
    const endpoint = `${process.env.NEXT_PUBLIC_AWS_STORAGE}/predictions/${kebabCasedProjectName}.csv`;
    const data = await d3.csv(endpoint);
    const animalsData = data as unknown as Array<BiodiversityAnimal>;
    return animalsData;
  } catch (e) {
    console.error(e);
    return null;
  }
};
