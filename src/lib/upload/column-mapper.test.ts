import { describe, expect, it } from "vitest";
import { autoDetectMappings, applyMappings } from "./column-mapper";

describe("autoDetectMappings", () => {
  it("detects standard column names for common occurrence fields", () => {
    const headers = ["lat", "lon", "species", "date", "observer"];
    const mappings = autoDetectMappings(headers);

    const byTarget = Object.fromEntries(mappings.map((m) => [m.targetField, m.sourceColumn]));
    expect(byTarget["decimalLatitude"]).toBe("lat");
    expect(byTarget["decimalLongitude"]).toBe("lon");
    expect(byTarget["scientificName"]).toBe("species");
    expect(byTarget["eventDate"]).toBe("date");
    expect(byTarget["recordedBy"]).toBe("observer");
  });

  it("handles mixed-case column names (case-insensitive matching)", () => {
    const headers = ["Latitude", "LONGITUDE", "Scientific_Name", "EventDate", "RecordedBy"];
    const mappings = autoDetectMappings(headers);

    const byTarget = Object.fromEntries(mappings.map((m) => [m.targetField, m.sourceColumn]));
    expect(byTarget["decimalLatitude"]).toBe("Latitude");
    expect(byTarget["decimalLongitude"]).toBe("LONGITUDE");
    expect(byTarget["scientificName"]).toBe("Scientific_Name");
    expect(byTarget["eventDate"]).toBe("EventDate");
    expect(byTarget["recordedBy"]).toBe("RecordedBy");
  });

  it("returns only matched columns (partial match — unrecognized headers excluded)", () => {
    const headers = ["lat", "lon", "unknown_field", "custom_column", "species"];
    const mappings = autoDetectMappings(headers);

    const sourceColumns = mappings.map((m) => m.sourceColumn);
    expect(sourceColumns).toContain("lat");
    expect(sourceColumns).toContain("lon");
    expect(sourceColumns).toContain("species");
    expect(sourceColumns).not.toContain("unknown_field");
    expect(sourceColumns).not.toContain("custom_column");
    expect(mappings).toHaveLength(3);
  });

  it("picks the first match when multiple source columns map to the same target", () => {
    // Both "lat" and "latitude" map to decimalLatitude; "lat" comes first
    const headers = ["lat", "latitude", "lon"];
    const mappings = autoDetectMappings(headers);

    const latMappings = mappings.filter((m) => m.targetField === "decimalLatitude");
    expect(latMappings).toHaveLength(1);
    expect(latMappings[0].sourceColumn).toBe("lat");
  });

  it("detects measurement fields (dbh, height, diameter, canopyCover)", () => {
    const headers = ["DBH", "tree_height", "trunk_diameter", "canopy_cover"];
    const mappings = autoDetectMappings(headers);

    const byTarget = Object.fromEntries(mappings.map((m) => [m.targetField, m.sourceColumn]));
    expect(byTarget["dbh"]).toBe("DBH");
    expect(byTarget["height"]).toBe("tree_height");
    expect(byTarget["diameter"]).toBe("trunk_diameter");
    expect(byTarget["canopyCover"]).toBe("canopy_cover");
  });

  it("detects all supported occurrence field aliases", () => {
    const headers = [
      "decimalLatitude",
      "decimalLongitude",
      "scientificName",
      "eventDate",
      "recordedBy",
      "vernacularName",
      "occurrenceRemarks",
      "country",
      "locality",
      "habitat",
    ];
    const mappings = autoDetectMappings(headers);
    expect(mappings).toHaveLength(10);
  });

  it("returns empty array for all unrecognized headers", () => {
    const headers = ["foo", "bar", "baz"];
    const mappings = autoDetectMappings(headers);
    expect(mappings).toHaveLength(0);
  });

  it("returns empty array for empty headers", () => {
    const mappings = autoDetectMappings([]);
    expect(mappings).toHaveLength(0);
  });

  it("does not map a column named 'name' to vernacularName (regression: bare 'name' was too broad)", () => {
    // A generic 'name' column should not be silently mapped to vernacularName
    const headers = ["name", "lat", "lon"];
    const mappings = autoDetectMappings(headers);

    const byTarget = Object.fromEntries(mappings.map((m) => [m.targetField, m.sourceColumn]));
    expect(byTarget["vernacularName"]).toBeUndefined();
    // 'name' should be unrecognized and excluded entirely
    const sourceColumns = mappings.map((m) => m.sourceColumn);
    expect(sourceColumns).not.toContain("name");
  });

  it("still maps explicit vernacular name aliases to vernacularName", () => {
    const headers = ["common_name", "lat", "lon"];
    const mappings = autoDetectMappings(headers);

    const byTarget = Object.fromEntries(mappings.map((m) => [m.targetField, m.sourceColumn]));
    expect(byTarget["vernacularName"]).toBe("common_name");
  });
});

describe("applyMappings", () => {
  it("remaps source columns to target field names", () => {
    const rows = [{ lat: "51.5", lon: "-0.1", species: "Quercus robur" }];
    const mappings = [
      { sourceColumn: "lat", targetField: "decimalLatitude" },
      { sourceColumn: "lon", targetField: "decimalLongitude" },
      { sourceColumn: "species", targetField: "scientificName" },
    ];

    const result = applyMappings(rows, mappings);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      decimalLatitude: "51.5",
      decimalLongitude: "-0.1",
      scientificName: "Quercus robur",
    });
  });

  it("applies transform functions when present in mappings", () => {
    const rows = [{ species: "  quercus robur  " }];
    const mappings = [
      {
        sourceColumn: "species",
        targetField: "scientificName",
        transform: (v: string) => v.trim().toLowerCase(),
      },
    ];

    const result = applyMappings(rows, mappings);
    expect(result[0]["scientificName"]).toBe("quercus robur");
  });

  it("drops source columns not in mappings", () => {
    const rows = [{ lat: "51.5", unmapped_col: "some value", species: "Quercus robur" }];
    const mappings = [
      { sourceColumn: "lat", targetField: "decimalLatitude" },
      { sourceColumn: "species", targetField: "scientificName" },
    ];

    const result = applyMappings(rows, mappings);
    expect(result[0]).not.toHaveProperty("unmapped_col");
    expect(result[0]).not.toHaveProperty("lat");
    expect(Object.keys(result[0])).toHaveLength(2);
  });

  it("excludes empty string source values from output rows", () => {
    const rows = [{ lat: "51.5", species: "", observer: "" }];
    const mappings = [
      { sourceColumn: "lat", targetField: "decimalLatitude" },
      { sourceColumn: "species", targetField: "scientificName" },
      { sourceColumn: "observer", targetField: "recordedBy" },
    ];

    const result = applyMappings(rows, mappings);
    expect(result[0]).toHaveProperty("decimalLatitude", "51.5");
    expect(result[0]).not.toHaveProperty("scientificName");
    expect(result[0]).not.toHaveProperty("recordedBy");
  });

  it("excludes undefined source values from output rows", () => {
    const rows = [{ lat: "51.5" } as Record<string, string>];
    const mappings = [
      { sourceColumn: "lat", targetField: "decimalLatitude" },
      { sourceColumn: "species", targetField: "scientificName" }, // "species" key doesn't exist
    ];

    const result = applyMappings(rows, mappings);
    expect(result[0]).toHaveProperty("decimalLatitude", "51.5");
    expect(result[0]).not.toHaveProperty("scientificName");
  });

  it("processes multiple rows correctly", () => {
    const rows = [
      { lat: "51.5", species: "Quercus robur" },
      { lat: "48.8", species: "Pinus sylvestris" },
      { lat: "40.7", species: "" },
    ];
    const mappings = [
      { sourceColumn: "lat", targetField: "decimalLatitude" },
      { sourceColumn: "species", targetField: "scientificName" },
    ];

    const result = applyMappings(rows, mappings);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ decimalLatitude: "51.5", scientificName: "Quercus robur" });
    expect(result[1]).toEqual({ decimalLatitude: "48.8", scientificName: "Pinus sylvestris" });
    expect(result[2]).toEqual({ decimalLatitude: "40.7" }); // species was empty
  });

  it("returns empty mapped rows when no mappings provided", () => {
    const rows = [{ lat: "51.5", species: "Quercus robur" }];
    const result = applyMappings(rows, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({});
  });

  it("returns empty array when no rows provided", () => {
    const mappings = [{ sourceColumn: "lat", targetField: "decimalLatitude" }];
    const result = applyMappings([], mappings);
    expect(result).toHaveLength(0);
  });
});
