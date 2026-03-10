import { describe, expect, it } from "vitest";
import { OccurrenceRowSchema, TreeRowSchema, parseAndValidateRows } from "./schemas";

describe("OccurrenceRowSchema", () => {
  it("validates a valid row with all required fields", () => {
    const result = OccurrenceRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "2024-03-15",
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scientificName).toBe("Quercus robur");
      expect(result.data.decimalLatitude).toBe(51.5);
      expect(result.data.decimalLongitude).toBe(-0.1);
      expect(result.data.basisOfRecord).toBe("HumanObservation");
    }
  });

  it("rejects a row missing scientificName", () => {
    const result = OccurrenceRowSchema.safeParse({
      eventDate: "2024-03-15",
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("scientificName");
    }
  });

  it("rejects invalid latitude (> 90)", () => {
    const result = OccurrenceRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "2024-03-15",
      decimalLatitude: "95",
      decimalLongitude: "-0.1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("decimalLatitude");
    }
  });

  it("rejects invalid longitude (> 180)", () => {
    const result = OccurrenceRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "2024-03-15",
      decimalLatitude: "51.5",
      decimalLongitude: "200",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("decimalLongitude");
    }
  });

  it("accepts various valid date formats", () => {
    const dates = ["2024-03-15", "03/15/2024", "2024", "2024-03-15T10:30:00Z"];
    for (const eventDate of dates) {
      const result = OccurrenceRowSchema.safeParse({
        scientificName: "Quercus robur",
        eventDate,
        decimalLatitude: "51.5",
        decimalLongitude: "-0.1",
      });
      expect(result.success, `Expected date "${eventDate}" to be valid`).toBe(true);
    }
  });

  it("rejects invalid date format", () => {
    const result = OccurrenceRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "not-a-date",
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("eventDate");
    }
  });
});

describe("TreeRowSchema", () => {
  it("coerces measurement fields from string to number", () => {
    const result = TreeRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "2024-03-15",
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
      height: "12.5",
      dbh: "30",
      diameter: "28",
      canopyCover: "75",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.height).toBe(12.5);
      expect(result.data.dbh).toBe(30);
      expect(result.data.diameter).toBe(28);
      expect(result.data.canopyCover).toBe(75);
    }
  });
});

describe("parseAndValidateRows", () => {
  const validRow = {
    scientificName: "Quercus robur",
    eventDate: "2024-03-15",
    decimalLatitude: "51.5",
    decimalLongitude: "-0.1",
  };

  it("returns valid rows with separated occurrence and measurement data", () => {
    const rows = [
      {
        ...validRow,
        height: "12.5",
        dbh: "30",
        recordedBy: "Jane Doe",
        locality: "Hyde Park",
      },
    ];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(0);

    const row = result.valid[0];
    expect(row.index).toBe(0);
    expect(row.occurrence.scientificName).toBe("Quercus robur");
    expect(row.occurrence.recordedBy).toBe("Jane Doe");
    expect(row.occurrence.locality).toBe("Hyde Park");
    expect(row.measurements).toHaveLength(2);
    expect(row.measurements[0]).toEqual({
      measurementType: "tree height",
      measurementValue: "12.5",
      measurementUnit: "m",
    });
    expect(row.measurements[1]).toEqual({
      measurementType: "DBH",
      measurementValue: "30",
      measurementUnit: "cm",
    });
  });

  it("skips empty measurement fields (not included in measurements array)", () => {
    const rows = [{ ...validRow }];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].measurements).toHaveLength(0);
  });

  it("returns error rows with row index and per-field error messages", () => {
    const rows = [
      { scientificName: "", eventDate: "bad-date", decimalLatitude: "999", decimalLongitude: "0" },
    ];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(1);

    const error = result.errors[0];
    expect(error.index).toBe(0);
    expect(error.issues.length).toBeGreaterThan(0);
    const paths = error.issues.map((i) => i.path);
    expect(paths).toContain("scientificName");
    expect(paths).toContain("decimalLatitude");
  });

  it("handles multiple errors per row", () => {
    const rows = [
      {
        scientificName: "",
        eventDate: "",
        decimalLatitude: "999",
        decimalLongitude: "999",
      },
    ];
    const result = parseAndValidateRows(rows);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].issues.length).toBeGreaterThanOrEqual(3);
  });

  it("processes mixed valid and invalid rows correctly", () => {
    const rows = [
      validRow,
      { scientificName: "", eventDate: "2024-01-01", decimalLatitude: "0", decimalLongitude: "0" },
      { ...validRow, scientificName: "Pinus sylvestris", height: "8" },
    ];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.valid[0].index).toBe(0);
    expect(result.valid[1].index).toBe(2);
    expect(result.errors[0].index).toBe(1);
  });

  it("creates correct MeasurementInput objects for all measurement types", () => {
    const rows = [
      {
        ...validRow,
        height: "10",
        dbh: "25",
        diameter: "23",
        canopyCover: "60",
      },
    ];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(1);
    const measurements = result.valid[0].measurements;
    expect(measurements).toHaveLength(4);

    const byType = Object.fromEntries(measurements.map((m) => [m.measurementType, m]));
    expect(byType["tree height"]).toEqual({
      measurementType: "tree height",
      measurementValue: "10",
      measurementUnit: "m",
    });
    expect(byType["DBH"]).toEqual({
      measurementType: "DBH",
      measurementValue: "25",
      measurementUnit: "cm",
    });
    expect(byType["diameter"]).toEqual({
      measurementType: "diameter",
      measurementValue: "23",
      measurementUnit: "cm",
    });
    expect(byType["canopy cover"]).toEqual({
      measurementType: "canopy cover",
      measurementValue: "60",
      measurementUnit: "%",
    });
  });
});
