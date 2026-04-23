import { describe, expect, it } from "vitest";
import { detectKoboFormat, getKoboColumnMappings } from "./kobo-mapper";

// ---------------------------------------------------------------------------
// Real Kobo headers from the migration script
// (Height, height, diameter, species, dateMeasured, Plant_Name, DBH,
//  FCD-tree_records-tree_time)
// ---------------------------------------------------------------------------
describe("detectKoboFormat — real Kobo headers from migration script", () => {
  const realKoboHeaders = [
    "Plant_Name",
    "DBH",
    "Height",
    "species",
    "FCD-tree_records-tree_time",
    "diameter",
  ];

  it("identifies real Kobo headers as a Kobo export (isKobo = true)", () => {
    const { isKobo, confidence } = detectKoboFormat(realKoboHeaders);
    expect(isKobo).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0.3);
  });

  it("maps Plant_Name to scientificName", () => {
    const { mappings } = detectKoboFormat(realKoboHeaders);
    const match = mappings.find((m) => m.sourceColumn === "Plant_Name");
    expect(match).toBeDefined();
    expect(match?.targetField).toBe("scientificName");
  });

  it("maps DBH to dbh", () => {
    const { mappings } = detectKoboFormat(realKoboHeaders);
    const match = mappings.find((m) => m.sourceColumn === "DBH");
    expect(match).toBeDefined();
    expect(match?.targetField).toBe("dbh");
  });

  it("maps Height to height", () => {
    const { mappings } = detectKoboFormat(realKoboHeaders);
    const match = mappings.find((m) => m.sourceColumn === "Height");
    expect(match).toBeDefined();
    expect(match?.targetField).toBe("height");
  });

  it("maps FCD-tree_records-tree_time to eventDate", () => {
    const { mappings } = detectKoboFormat(realKoboHeaders);
    const match = mappings.find(
      (m) => m.sourceColumn === "FCD-tree_records-tree_time"
    );
    expect(match).toBeDefined();
    expect(match?.targetField).toBe("eventDate");
  });
});

// ---------------------------------------------------------------------------
// Generic CSV headers — should have low confidence (< 0.3)
// ---------------------------------------------------------------------------
describe("detectKoboFormat — generic CSV headers (low confidence)", () => {
  const genericHeaders = ["id", "name", "value", "category", "description", "created_at"];

  it("returns isKobo = false for generic CSV headers", () => {
    const { isKobo, confidence } = detectKoboFormat(genericHeaders);
    expect(isKobo).toBe(false);
    expect(confidence).toBeLessThan(0.3);
  });
});

// ---------------------------------------------------------------------------
// Standard Darwin Core headers — must NOT be detected as KoboToolbox
// ---------------------------------------------------------------------------
describe("detectKoboFormat — standard Darwin Core headers (false positive guard)", () => {
  const dwcHeaders = [
    "scientificName",
    "eventDate",
    "decimalLatitude",
    "decimalLongitude",
    "vernacularName",
    "recordedBy",
    "locality",
    "height",
    "dbh",
  ];

  it("returns isKobo = false for standard Darwin Core headers", () => {
    const { isKobo } = detectKoboFormat(dwcHeaders);
    expect(isKobo).toBe(false);
  });

  it("still produces mappings for recognized generic patterns (height, dbh, locality)", () => {
    const { mappings } = detectKoboFormat(dwcHeaders);
    // height, dbh, locality are generic patterns that still map correctly
    expect(mappings.find((m) => m.sourceColumn === "height")).toBeDefined();
    expect(mappings.find((m) => m.sourceColumn === "dbh")).toBeDefined();
    expect(mappings.find((m) => m.sourceColumn === "locality")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GPS single-field splitting
// ---------------------------------------------------------------------------
describe("GPS single-field format", () => {
  it("produces TWO mappings from a single GPS column", () => {
    const headers = ["GPS"];
    const mappings = getKoboColumnMappings(headers);
    const latMapping = mappings.find((m) => m.targetField === "decimalLatitude");
    const lonMapping = mappings.find((m) => m.targetField === "decimalLongitude");
    expect(latMapping).toBeDefined();
    expect(lonMapping).toBeDefined();
    expect(latMapping?.sourceColumn).toBe("GPS");
    expect(lonMapping?.sourceColumn).toBe("GPS");
  });

  it("transform extracts latitude (index 0) from combined GPS string", () => {
    const headers = ["GPS"];
    const mappings = getKoboColumnMappings(headers);
    const latMapping = mappings.find((m) => m.targetField === "decimalLatitude");
    expect(latMapping?.transform).toBeDefined();
    const result = latMapping!.transform!("1.2345 103.8765 10 5");
    expect(result).toBe("1.2345");
  });

  it("transform extracts longitude (index 1) from combined GPS string", () => {
    const headers = ["GPS"];
    const mappings = getKoboColumnMappings(headers);
    const lonMapping = mappings.find((m) => m.targetField === "decimalLongitude");
    expect(lonMapping?.transform).toBeDefined();
    const result = lonMapping!.transform!("1.2345 103.8765 10 5");
    expect(result).toBe("103.8765");
  });

  it("handles geopoint column the same way as GPS", () => {
    const headers = ["geopoint"];
    const mappings = getKoboColumnMappings(headers);
    const latMapping = mappings.find((m) => m.targetField === "decimalLatitude");
    const lonMapping = mappings.find((m) => m.targetField === "decimalLongitude");
    expect(latMapping).toBeDefined();
    expect(lonMapping).toBeDefined();
    expect(latMapping!.transform!("-6.1234 106.8456 0 3")).toBe("-6.1234");
    expect(lonMapping!.transform!("-6.1234 106.8456 0 3")).toBe("106.8456");
  });
});

// ---------------------------------------------------------------------------
// Case-insensitive matching
// ---------------------------------------------------------------------------
describe("case-insensitive matching", () => {
  it("matches plant_name (lowercase)", () => {
    const mappings = getKoboColumnMappings(["plant_name"]);
    expect(mappings.find((m) => m.targetField === "scientificName")).toBeDefined();
  });

  it("matches Plant_Name (mixed case)", () => {
    const mappings = getKoboColumnMappings(["Plant_Name"]);
    expect(mappings.find((m) => m.targetField === "scientificName")).toBeDefined();
  });

  it("matches PLANT_NAME (uppercase)", () => {
    const mappings = getKoboColumnMappings(["PLANT_NAME"]);
    expect(mappings.find((m) => m.targetField === "scientificName")).toBeDefined();
  });

  it("matches Latitude (title case)", () => {
    const mappings = getKoboColumnMappings(["Latitude"]);
    expect(mappings.find((m) => m.targetField === "decimalLatitude")).toBeDefined();
  });

  it("matches LONGITUDE (uppercase)", () => {
    const mappings = getKoboColumnMappings(["LONGITUDE"]);
    expect(mappings.find((m) => m.targetField === "decimalLongitude")).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Empty headers
// ---------------------------------------------------------------------------
describe("empty headers", () => {
  it("returns empty mappings for empty header array", () => {
    const mappings = getKoboColumnMappings([]);
    expect(mappings).toHaveLength(0);
  });

  it("detectKoboFormat returns isKobo=false and confidence=0 for empty headers", () => {
    const { isKobo, confidence, mappings } = detectKoboFormat([]);
    expect(isKobo).toBe(false);
    expect(confidence).toBe(0);
    expect(mappings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Unrecognized headers are not included
// ---------------------------------------------------------------------------
describe("unrecognized headers are excluded", () => {
  it("does not include unrecognized headers in mappings", () => {
    const headers = ["foo", "bar", "baz", "unknown_field"];
    const mappings = getKoboColumnMappings(headers);
    expect(mappings).toHaveLength(0);
  });

  it("only includes recognized headers in a mixed list", () => {
    const headers = ["foo", "Plant_Name", "bar", "DBH", "unknown"];
    const mappings = getKoboColumnMappings(headers);
    const sourceCols = mappings.map((m) => m.sourceColumn);
    expect(sourceCols).toContain("Plant_Name");
    expect(sourceCols).toContain("DBH");
    expect(sourceCols).not.toContain("foo");
    expect(sourceCols).not.toContain("bar");
    expect(sourceCols).not.toContain("unknown");
  });
});

// ---------------------------------------------------------------------------
// Mixed Kobo + generic headers
// ---------------------------------------------------------------------------
describe("mixed Kobo + generic headers", () => {
  const mixedHeaders = [
    "id",
    "Plant_Name",
    "GPS",
    "DBH",
    "Height",
    "notes",
    "category",
    "description",
  ];

  it("detects as Kobo when enough Kobo headers are present", () => {
    const { isKobo, confidence } = detectKoboFormat(mixedHeaders);
    // 5 recognized out of 8 = 0.625 confidence
    expect(isKobo).toBe(true);
    expect(confidence).toBeGreaterThanOrEqual(0.3);
  });

  it("only maps recognized columns", () => {
    const { mappings } = detectKoboFormat(mixedHeaders);
    const sourceCols = mappings.map((m) => m.sourceColumn);
    expect(sourceCols).toContain("Plant_Name");
    expect(sourceCols).toContain("GPS"); // appears twice (lat + lon)
    expect(sourceCols).toContain("DBH");
    expect(sourceCols).toContain("Height");
    expect(sourceCols).toContain("notes");
    expect(sourceCols).not.toContain("id");
    expect(sourceCols).not.toContain("category");
    expect(sourceCols).not.toContain("description");
  });

  it("GPS column produces both lat and lon mappings", () => {
    const { mappings } = detectKoboFormat(mixedHeaders);
    const gpsMappings = mappings.filter((m) => m.sourceColumn === "GPS");
    expect(gpsMappings).toHaveLength(2);
    const targets = gpsMappings.map((m) => m.targetField);
    expect(targets).toContain("decimalLatitude");
    expect(targets).toContain("decimalLongitude");
  });
});

// ---------------------------------------------------------------------------
// Duplicate target field deduplication
// ---------------------------------------------------------------------------
describe("duplicate target field deduplication", () => {
  it("does not produce duplicate target fields when multiple headers match the same target", () => {
    // Both 'species' and 'Plant_Name' map to scientificName
    const headers = ["species", "Plant_Name"];
    const mappings = getKoboColumnMappings(headers);
    const scientificNameMappings = mappings.filter(
      (m) => m.targetField === "scientificName"
    );
    expect(scientificNameMappings).toHaveLength(1);
  });
});
