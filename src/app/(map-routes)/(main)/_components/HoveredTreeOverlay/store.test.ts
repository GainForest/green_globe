import { describe, expect, it, beforeEach } from "vitest";
import useHoveredTreeOverlayStore, { type TreeInformation } from "./store";

const treeA: TreeInformation = {
  treeUri: "at://did/tree-a",
  treeSpecies: "Rhizophora mucronata",
  treeHeight: "2m",
  treeDBH: "10cm",
  treeRootCollarDiameter: "4cm",
  treePhotos: ["/tree-a.jpg"],
  dateOfMeasurement: "2026-01-01",
};

const treeB: TreeInformation = {
  treeUri: "at://did/tree-b",
  treeSpecies: "Avicennia marina",
  treeHeight: "3m",
  treeDBH: "12cm",
  treeRootCollarDiameter: "5cm",
  treePhotos: ["/tree-b.jpg"],
  dateOfMeasurement: "2026-01-02",
};

describe("hovered tree overlay store", () => {
  beforeEach(() => {
    const store = useHoveredTreeOverlayStore.getState();
    store.clearSelectedTreeInformation();
    store.setTreeInformation(null);
    store.setIsExpanded(false);
  });

  it("pins selected tree information while allowing hover previews", () => {
    const store = useHoveredTreeOverlayStore.getState();

    store.setSelectedTreeInformation(treeA);
    expect(useHoveredTreeOverlayStore.getState().selectedTreeInformation).toEqual(treeA);
    expect(useHoveredTreeOverlayStore.getState().treeInformation).toEqual(treeA);

    store.setTreeInformation(treeB);
    expect(useHoveredTreeOverlayStore.getState().treeInformation).toEqual(treeB);
    expect(useHoveredTreeOverlayStore.getState().selectedTreeInformation).toEqual(treeA);

    store.setTreeInformation(useHoveredTreeOverlayStore.getState().selectedTreeInformation);
    expect(useHoveredTreeOverlayStore.getState().treeInformation).toEqual(treeA);
  });

  it("clears selected tree information and collapsed state together", () => {
    const store = useHoveredTreeOverlayStore.getState();

    store.setSelectedTreeInformation(treeA);
    store.setIsExpanded(true);
    store.clearSelectedTreeInformation();

    expect(useHoveredTreeOverlayStore.getState().selectedTreeInformation).toBeNull();
    expect(useHoveredTreeOverlayStore.getState().treeInformation).toBeNull();
    expect(useHoveredTreeOverlayStore.getState().isExpanded).toBe(false);
  });
});
