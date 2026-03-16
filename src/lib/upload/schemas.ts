import { z } from "zod";
import type { FloraMeasurementBundle, OccurrenceInput, ValidationResult } from "./types";

const DATE_PATTERNS = [
  /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
  /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY (same regex, both accepted)
  /^\d{4}$/, // YYYY
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO 8601 datetime
];

function isValidDate(value: string): boolean {
  return DATE_PATTERNS.some((pattern) => pattern.test(value));
}

export const OccurrenceRowSchema = z.object({
  scientificName: z.string().min(1, "Scientific name is required"),
  eventDate: z
    .string()
    .min(1, "Event date is required")
    .refine(isValidDate, {
      message:
        "Date must be in ISO 8601 or common format (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, YYYY)",
    }),
  decimalLatitude: z.coerce.number().min(-90).max(90),
  decimalLongitude: z.coerce.number().min(-180).max(180),
  basisOfRecord: z.string().optional().default("HumanObservation"),
  vernacularName: z.string().optional(),
  recordedBy: z.string().optional(),
  locality: z.string().optional(),
  country: z.string().optional(),
  countryCode: z.string().optional(),
  occurrenceRemarks: z.string().optional(),
  habitat: z.string().optional(),
  samplingProtocol: z.string().optional(),
  kingdom: z.string().optional(),
});

const MeasurementFields = {
  height: z.coerce.number().positive().optional(),
  dbh: z.coerce.number().positive().optional(),
  diameter: z.coerce.number().positive().optional(),
  canopyCover: z.coerce.number().min(0).max(100).optional(),
};

export const TreeRowSchema = OccurrenceRowSchema.merge(z.object(MeasurementFields));

type TreeRowOutput = z.output<typeof TreeRowSchema>;

function extractFloraMeasurement(row: TreeRowOutput): FloraMeasurementBundle | null {
  const bundle: FloraMeasurementBundle = {};

  if (row.height !== undefined) {
    bundle.totalHeight = String(row.height);
  }

  if (row.dbh !== undefined) {
    bundle.dbh = String(row.dbh);
  }

  if (row.diameter !== undefined) {
    bundle.diameter = String(row.diameter);
  }

  if (row.canopyCover !== undefined) {
    bundle.canopyCoverPercent = String(row.canopyCover);
  }

  const hasAnyField =
    bundle.totalHeight !== undefined ||
    bundle.dbh !== undefined ||
    bundle.diameter !== undefined ||
    bundle.canopyCoverPercent !== undefined;

  return hasAnyField ? bundle : null;
}

function extractOccurrence(row: TreeRowOutput): OccurrenceInput {
  return {
    scientificName: row.scientificName,
    eventDate: row.eventDate,
    decimalLatitude: row.decimalLatitude,
    decimalLongitude: row.decimalLongitude,
    basisOfRecord: row.basisOfRecord,
    vernacularName: row.vernacularName,
    recordedBy: row.recordedBy,
    locality: row.locality,
    country: row.country,
    countryCode: row.countryCode,
    occurrenceRemarks: row.occurrenceRemarks,
    habitat: row.habitat,
    samplingProtocol: row.samplingProtocol,
    kingdom: row.kingdom,
  };
}

export function parseAndValidateRows(rows: Record<string, string>[]): ValidationResult {
  const valid = [];
  const errors = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index] as unknown;
    const result = TreeRowSchema.safeParse(row);

    if (result.success) {
      const occurrence = extractOccurrence(result.data);
      const floraMeasurement = extractFloraMeasurement(result.data);
      valid.push({ index, occurrence, floraMeasurement });
    } else {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.join(".") || "root",
        message: issue.message,
      }));
      errors.push({ index, issues });
    }
  }

  return { valid, errors };
}
