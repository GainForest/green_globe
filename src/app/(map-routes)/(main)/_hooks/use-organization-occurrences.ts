"use client";

import { useQuery } from "@tanstack/react-query";
import ClimateAIAgent from "@/lib/atproto/agent";
import type {
  BiodiversityAnimal,
  BiodiversityPlant,
  BiodiversityTraits,
} from "../_components/ProjectOverlay/Biodiversity/Predictions/store/types";

const OCCURRENCE_COLLECTION = "app.gainforest.dwc.occurrence";

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
  dynamicProperties?: unknown;
  conservationStatus?: unknown;
  plantTraits?: unknown;
  basisOfRecord?: unknown;
  [k: string]: unknown;
};

type RawOccurrenceRecord = {
  uri: string;
  cid: string;
  value: RawOccurrenceValue;
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

  // Only return traits object if at least one field is present
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

  const speciesImageUrl =
    typeof v.speciesImageUrl === "string" ? v.speciesImageUrl : undefined;
  const thumbnailUrl =
    typeof v.thumbnailUrl === "string" ? v.thumbnailUrl : undefined;
  const imageUrl = speciesImageUrl ?? thumbnailUrl;

  // edibleParts may come from plantTraits.edibleParts
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

// ── Filter type ────────────────────────────────────────────────────────────────

export type OccurrenceFilter = {
  kingdom?: "Plantae" | "Animalia";
  basisOfRecord?: string;
};

// ── Fetcher ────────────────────────────────────────────────────────────────────

type FetchedOccurrences = {
  trees: BiodiversityPlant[];
  herbs: BiodiversityPlant[];
  animals: BiodiversityAnimal[];
};

const fetchAllOccurrenceRecords = async (
  did: string,
  filter?: OccurrenceFilter,
): Promise<FetchedOccurrences> => {
  const trees: BiodiversityPlant[] = [];
  const herbs: BiodiversityPlant[] = [];
  const animals: BiodiversityAnimal[] = [];
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: OCCURRENCE_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawOccurrenceRecord[] | undefined;
    if (page?.length) {
      for (const record of page) {
        const kingdom =
          typeof record.value.kingdom === "string"
            ? record.value.kingdom
            : undefined;

        // Apply kingdom filter if provided
        if (filter?.kingdom && kingdom !== filter.kingdom) continue;

        // Apply basisOfRecord filter if provided
        if (filter?.basisOfRecord) {
          const basisOfRecord =
            typeof record.value.basisOfRecord === "string"
              ? record.value.basisOfRecord
              : undefined;
          if (basisOfRecord !== filter.basisOfRecord) continue;
        }

        if (kingdom === "Plantae") {
          const plant = normalizePlantRecord(record);
          if (plant) {
            const { _dataType, ...plantData } = plant;
            if (_dataType === "herbs") {
              herbs.push(plantData);
            } else {
              trees.push(plantData);
            }
          }
        } else if (kingdom === "Animalia") {
          const animal = normalizeAnimalRecord(record);
          if (animal) animals.push(animal);
        }
      }
    }

    cursor = response.data.cursor ?? undefined;
  } while (cursor);

  return { trees, herbs, animals };
};

// ── Return type ────────────────────────────────────────────────────────────────

export type UseOrganizationOccurrencesResult = {
  plants: {
    trees: BiodiversityPlant[];
    herbs: BiodiversityPlant[];
  };
  animals: BiodiversityAnimal[];
  isLoading: boolean;
  error: Error | null;
};

// ── Hook ───────────────────────────────────────────────────────────────────────

const useOrganizationOccurrences = (
  did: string | null | undefined,
  filter?: OccurrenceFilter,
): UseOrganizationOccurrencesResult => {
  const occurrencesQuery = useQuery({
    queryKey: ["organization-occurrences", did, filter],
    queryFn: async () => {
      if (!did) return { trees: [], herbs: [], animals: [] };
      return fetchAllOccurrenceRecords(did, filter);
    },
    enabled: Boolean(did),
  });

  return {
    plants: {
      trees: occurrencesQuery.data?.trees ?? [],
      herbs: occurrencesQuery.data?.herbs ?? [],
    },
    animals: occurrencesQuery.data?.animals ?? [],
    isLoading: occurrencesQuery.isLoading,
    error: occurrencesQuery.error as Error | null,
  };
};

export default useOrganizationOccurrences;
