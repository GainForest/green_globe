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
    const dates = [
      ["2024-03-15", "2024-03-15"],
      ["03/15/2024", "2024-03-15"],
      ["30/10/22 12:09", "2022-10-30"],
      ["44846.60625", "2022-10-12"],
      ["2024", "2024"],
      ["2024-03-15T10:30:00Z", "2024-03-15"],
    ] as const;
    for (const [eventDate, normalized] of dates) {
      const result = OccurrenceRowSchema.safeParse({
        scientificName: "Quercus robur",
        eventDate,
        decimalLatitude: "51.5",
        decimalLongitude: "-0.1",
      });
      expect(result.success, `Expected date "${eventDate}" to be valid`).toBe(true);
      if (result.success) {
        expect(result.data.eventDate).toBe(normalized);
      }
    }
  });

  it("rejects ambiguous slash date formats", () => {
    const result = OccurrenceRowSchema.safeParse({
      scientificName: "Quercus robur",
      eventDate: "03/04/2024",
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain("eventDate");
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
    expect(row.floraMeasurement).not.toBeNull();
    expect(row.floraMeasurement?.totalHeight).toBe("12.5");
    expect(row.floraMeasurement?.dbh).toBe("30");
  });

  it("skips empty measurement fields (floraMeasurement is null)", () => {
    const rows = [{ ...validRow }];
    const result = parseAndValidateRows(rows);
    expect(result.valid).toHaveLength(1);
    expect(result.valid[0].floraMeasurement).toBeNull();
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

  it("creates correct FloraMeasurementBundle from parsed fields", () => {
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
    const floraMeasurement = result.valid[0].floraMeasurement;
    expect(floraMeasurement).not.toBeNull();
    expect(floraMeasurement?.dbh).toBe("25");
    expect(floraMeasurement?.totalHeight).toBe("10");
    expect(floraMeasurement?.diameter).toBe("23");
    expect(floraMeasurement?.canopyCoverPercent).toBe("60");
  });
});
