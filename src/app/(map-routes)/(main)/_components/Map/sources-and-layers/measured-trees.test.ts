import { describe, expect, it } from "vitest";

import {
  getTreeDBH,
  getTreeRootCollarDiameter,
} from "./measured-trees";
import type { TreeFeature } from "../../ProjectOverlay/store/types";

const treeProperties = (
  overrides: Partial<TreeFeature["properties"]>,
): TreeFeature["properties"] => ({
  lat: 0,
  lon: 0,
  species: "Rhizophora mucronata",
  awsUrl: "",
  koboUrl: "",
  barkAwsUrl: "",
  barkKoboUrl: "",
  ...overrides,
});

describe("measured tree details", () => {
  it("keeps DBH separate from root collar diameter", () => {
    const tree = treeProperties({ DBH: "12", basalDiameter: "4.5" });

    expect(getTreeDBH(tree)).toBe("12cm");
    expect(getTreeRootCollarDiameter(tree)).toBe("4.5cm");
  });

  it("uses legacy diameter values as root collar diameter", () => {
    const tree = treeProperties({ diameter: "5.2" });

    expect(getTreeDBH(tree)).toBe("unknown");
    expect(getTreeRootCollarDiameter(tree)).toBe("5.2cm");
  });
});
