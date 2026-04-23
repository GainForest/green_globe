export type ColumnMapping = {
  sourceColumn: string;
  targetField: string;
  transform?: (value: string) => string;
};

export type MappedRow = Record<string, string>;

export type OccurrenceInput = {
  scientificName: string;
  eventDate: string;
  decimalLatitude: number;
  decimalLongitude: number;
  basisOfRecord?: string;
  vernacularName?: string;
  recordedBy?: string;
  locality?: string;
  country?: string;
  countryCode?: string;
  occurrenceRemarks?: string;
  habitat?: string;
  samplingProtocol?: string;
  kingdom?: string;
};

/**
 * @deprecated Use FloraMeasurementBundle instead. Kept for backward compat with the DwC-A pipeline.
 */
export type MeasurementInput = {
  measurementType: string;
  measurementValue: string;
  measurementUnit?: string;
  measurementMethod?: string;
};

export type FloraMeasurementBundle = {
  dbh?: string; // value in cm
  totalHeight?: string; // value in m
  diameter?: string; // value in cm (maps to basalDiameter if non-DBH)
  canopyCoverPercent?: string; // value as percentage string
};

export type ValidatedRow = {
  index: number;
  occurrence: OccurrenceInput;
  floraMeasurement: FloraMeasurementBundle | null; // null when no measurements present
};

export type RowError = {
  index: number;
  issues: { path: string; message: string }[];
};

export type ValidationResult = {
  valid: ValidatedRow[];
  errors: RowError[];
};

export const TARGET_FIELDS = [
  { field: "scientificName", label: "Scientific Name", required: true, category: "occurrence" },
  { field: "eventDate", label: "Event Date", required: true, category: "occurrence" },
  { field: "decimalLatitude", label: "Latitude", required: true, category: "occurrence" },
  { field: "decimalLongitude", label: "Longitude", required: true, category: "occurrence" },
  { field: "vernacularName", label: "Common Name", required: false, category: "occurrence" },
  { field: "recordedBy", label: "Recorded By", required: false, category: "occurrence" },
  { field: "locality", label: "Locality", required: false, category: "occurrence" },
  { field: "country", label: "Country", required: false, category: "occurrence" },
  { field: "occurrenceRemarks", label: "Remarks", required: false, category: "occurrence" },
  { field: "habitat", label: "Habitat", required: false, category: "occurrence" },
  { field: "height", label: "Tree Height (m)", required: false, category: "measurement" },
  { field: "dbh", label: "DBH (cm)", required: false, category: "measurement" },
  { field: "diameter", label: "Diameter (cm)", required: false, category: "measurement" },
  { field: "canopyCover", label: "Canopy Cover (%)", required: false, category: "measurement" },
] as const;
