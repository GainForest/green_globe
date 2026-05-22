import { describe, expect, test } from "vitest";
import {
  normalizePreviewDatasetRefs,
  parsePreviewMode,
  previewDatasetRefsEqual,
  resolvePreviewMode,
} from "./params";

describe("preview dataset refs params", () => {
  test("normalizes repeated dataset-ref params", () => {
    expect(
      normalizePreviewDatasetRefs([
        "at://did:plc:test/app.gainforest.dwc.dataset/a",
        " at://did:plc:test/app.gainforest.dwc.dataset/b ",
        "at://did:plc:test/app.gainforest.dwc.dataset/a",
        "",
      ]),
    ).toEqual([
      "at://did:plc:test/app.gainforest.dwc.dataset/a",
      "at://did:plc:test/app.gainforest.dwc.dataset/b",
    ]);
  });

  test("also accepts comma-separated refs for compatibility", () => {
    expect(normalizePreviewDatasetRefs(["a,b", " c "])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  test("compares normalized refs in order", () => {
    expect(previewDatasetRefsEqual(["a", "b"], ["a", "b"])).toBe(true);
    expect(previewDatasetRefsEqual(["a", "b"], ["b", "a"])).toBe(false);
  });

  test("parses supported preview modes", () => {
    expect(parsePreviewMode("all")).toBe("all");
    expect(parsePreviewMode("ONLY")).toBe("only");
    expect(parsePreviewMode(" none ")).toBe("none");
    expect(parsePreviewMode("hidden")).toBeNull();
    expect(parsePreviewMode(null)).toBeNull();
  });

  test("defaults dataset-ref URLs to only mode unless explicitly overridden", () => {
    expect(resolvePreviewMode({ explicitMode: null, datasetRefs: ["a"] })).toBe(
      "only",
    );
    expect(resolvePreviewMode({ explicitMode: null, datasetRefs: [] })).toBe("all");
    expect(resolvePreviewMode({ explicitMode: "none", datasetRefs: ["a"] })).toBe(
      "none",
    );
    expect(resolvePreviewMode({ explicitMode: "all", datasetRefs: ["a"] })).toBe(
      "all",
    );
  });
});
