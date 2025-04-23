export type BiodiversityTraits = {
  barkThickness: number;
  rootDepth: number;
  stemConduitDiameter: number;
  stemDiameter: number;
  treeHeight: number;
  woodDensity: number;
};

export type BiodiversityPlant = {
  awsUrl?: string;
  imageUrl?: string;
  edibleParts?: string[];
  group: string;
  key: string;
  scientificName: string;
  commonName?: string;
  iucnCategory?: string;
  iucnTaxonId?: number;
  traits?: BiodiversityTraits;
};

export type BiodiversityAnimal = {
  Species: string;
  Type: "Reptile" | "Amphibian" | "Mammal" | "Bird" | "IUCN Red List";
};
