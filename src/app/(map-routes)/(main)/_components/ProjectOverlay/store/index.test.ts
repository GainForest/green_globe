import { afterEach, describe, expect, it } from "vitest";
import usePreviewStore from "../../../_features/preview/store";
import { applyPreviewFilters, getPreviewBoundsData } from ".";
import type { MeasuredTreesGeoJSON } from "./types";

const datasetOne = "at://did:plc:org/app.gainforest.dwc.dataset/one";
const datasetTwo = "at://did:plc:org/app.gainforest.dwc.dataset/two";
const datasetThree = "at://did:plc:org/app.gainforest.dwc.dataset/three";
const treeOne = "at://did:plc:org/app.gainforest.dwc.occurrence/tree-one";
const treeTwo = "at://did:plc:org/app.gainforest.dwc.occurrence/tree-two";
const treeThree = "at://did:plc:org/app.gainforest.dwc.occurrence/tree-three";

function treeFeature(
  id: string,
  datasetRef: string,
  occurrenceUri: string,
): MeasuredTreesGeoJSON["features"][number] {
  return {
    id,
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [0, 0],
    },
    properties: {
      type: "measured-tree",
      datasetRef,
      occurrenceUri,
    },
  } as MeasuredTreesGeoJSON["features"][number];
}

const measuredTrees: MeasuredTreesGeoJSON = {
  type: "FeatureCollection",
  features: [
    treeFeature("one", datasetOne, treeOne),
    treeFeature("two", datasetTwo, treeTwo),
    treeFeature("three", datasetThree, treeThree),
  ],
};

function filteredIds(data: MeasuredTreesGeoJSON | null): string[] {
  return data?.features.map((feature) => String(feature.id)) ?? [];
}

afterEach(() => {
  usePreviewStore.getState().setPreviewState({
    embedMode: false,
    treeUri: null,
    datasetRefs: [],
    focusedDatasetRef: null,
    focusedSiteRef: null,
    previewMode: "all",
  });
});

describe("applyPreviewFilters", () => {
  it("keeps all trees in all mode", () => {
    usePreviewStore.getState().setPreviewState({
      embedMode: true,
      treeUri: null,
      datasetRefs: [],
      focusedDatasetRef: null,
      focusedSiteRef: null,
      previewMode: "all",
    });

    expect(filteredIds(applyPreviewFilters(measuredTrees))).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("keeps only selected dataset refs in only mode", () => {
    usePreviewStore.getState().setPreviewState({
      embedMode: true,
      treeUri: null,
      datasetRefs: [datasetOne, datasetThree],
      focusedDatasetRef: datasetThree,
      focusedSiteRef: null,
      previewMode: "only",
    });

    expect(filteredIds(applyPreviewFilters(measuredTrees))).toEqual([
      "one",
      "three",
    ]);
  });

  it("clears all trees in none mode", () => {
    usePreviewStore.getState().setPreviewState({
      embedMode: true,
      treeUri: null,
      datasetRefs: [],
      focusedDatasetRef: null,
      focusedSiteRef: null,
      previewMode: "none",
    });

    expect(filteredIds(applyPreviewFilters(measuredTrees))).toEqual([]);
  });

  it("uses the focused dataset when choosing preview bounds", () => {
    usePreviewStore.getState().setPreviewState({
      embedMode: true,
      treeUri: null,
      datasetRefs: [datasetOne, datasetThree],
      focusedDatasetRef: datasetThree,
      focusedSiteRef: null,
      previewMode: "only",
    });

    const filteredData = applyPreviewFilters(measuredTrees);

    expect(filteredIds(getPreviewBoundsData(filteredData ?? measuredTrees))).toEqual([
      "three",
    ]);
  });

  it("unions and marks a selected treeUri with selected dataset refs", () => {
    usePreviewStore.getState().setPreviewState({
      embedMode: true,
      treeUri: treeTwo,
      datasetRefs: [datasetOne],
      focusedDatasetRef: datasetOne,
      focusedSiteRef: null,
      previewMode: "only",
    });

    const filteredData = applyPreviewFilters(measuredTrees);

    expect(filteredIds(filteredData)).toEqual(["one", "two"]);
    expect(
      filteredData?.features.map((feature) => feature.properties.selected),
    ).toEqual([false, true]);
  });
});
