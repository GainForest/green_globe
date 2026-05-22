import { describe, expect, it } from "vitest";
import {
  buildGreenGlobePreviewAckMessage,
  buildGreenGlobePreviewReadyMessage,
  GREEN_GLOBE_PREVIEW_ACK_MESSAGE_TYPE,
  GREEN_GLOBE_PREVIEW_READY_MESSAGE_TYPE,
  GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
  isAllowedGreenGlobePreviewParentOrigin,
  LEGACY_GREEN_GLOBE_PREVIEW_FOCUS_TREE_MESSAGE_TYPE,
  previewStateFromMessage,
} from "./messages";

const projectDid = "did:plc:org";
const datasetOne = "at://did:plc:org/app.gainforest.dwc.dataset/one";
const datasetTwo = "at://did:plc:org/app.gainforest.dwc.dataset/two";
const siteOne = "at://did:plc:org/app.certified.location/site-one";
const siteTwo = "at://did:plc:org/app.certified.location/site-two";

const datasetLayers = [
  {
    datasetRef: datasetOne,
    title: "Dataset one",
    siteRef: { uri: siteOne, cid: "bafy-site-one" },
  },
  {
    datasetRef: datasetTwo,
    title: "Dataset two",
    siteRef: { uri: siteTwo, cid: "bafy-site-two" },
  },
];

describe("Green Globe preview messages", () => {
  it("builds ready and ack messages", () => {
    expect(buildGreenGlobePreviewReadyMessage(projectDid)).toEqual({
      type: GREEN_GLOBE_PREVIEW_READY_MESSAGE_TYPE,
      version: 1,
      projectDid,
      capabilities: [
        "datasetRefs",
        "previewMode",
        "clearSelection",
        "fitBounds",
        "focusedDatasetRef",
        "focusedSiteRef",
      ],
    });

    expect(
      buildGreenGlobePreviewAckMessage({
        projectDid,
        requestId: "request-1",
        accepted: true,
      }),
    ).toEqual({
      type: GREEN_GLOBE_PREVIEW_ACK_MESSAGE_TYPE,
      version: 1,
      projectDid,
      requestId: "request-1",
      accepted: true,
    });
  });

  it("accepts dataset-layer messages for the active embed project", () => {
    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "bumicerts",
          requestId: "request-1",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [datasetOne, `${datasetTwo}, ${datasetOne}`],
          focusedDatasetRef: datasetTwo,
          emptySelection: "clear",
        },
        projectDid,
      ),
    ).toEqual({
      requestId: "request-1",
      state: {
        embedMode: true,
        treeUri: null,
        datasetRefs: [datasetOne, datasetTwo],
        focusedDatasetRef: datasetTwo,
        focusedSiteRef: siteTwo,
        previewMode: "only",
      },
    });
  });

  it("turns empty timeline layer selections into explicit none mode", () => {
    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "bumicerts",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [],
          emptySelection: "clear",
        },
        projectDid,
      ),
    ).toMatchObject({
      state: {
        datasetRefs: [],
        focusedDatasetRef: null,
        focusedSiteRef: null,
        previewMode: "none",
      },
    });
  });

  it("rejects messages with invalid version, source, project, or refs", () => {
    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 2,
          source: "bumicerts",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [datasetOne],
        },
        projectDid,
      ),
    ).toBeNull();

    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "other",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [datasetOne],
        },
        projectDid,
      ),
    ).toBeNull();

    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "bumicerts",
          projectDid: "did:plc:other",
          datasetLayers,
          activeDatasetRefs: [datasetOne],
        },
        projectDid,
      ),
    ).toBeNull();

    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "bumicerts",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [
            "at://did:plc:org/app.gainforest.dwc.dataset/not-in-layers",
          ],
        },
        projectDid,
      ),
    ).toBeNull();

    expect(
      previewStateFromMessage(
        {
          type: GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE,
          version: 1,
          source: "bumicerts",
          projectDid,
          datasetLayers,
          activeDatasetRefs: [datasetOne],
          focusedDatasetRef: datasetTwo,
        },
        projectDid,
      ),
    ).toBeNull();
  });

  it("uses configured parent origins as a restrictive allowlist", () => {
    const originalOrigins = process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS;
    process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS =
      "https://bumicerts.gainforest.app, https://preview.example.com/";

    try {
      expect(
        isAllowedGreenGlobePreviewParentOrigin("https://bumicerts.gainforest.app"),
      ).toBe(true);
      expect(isAllowedGreenGlobePreviewParentOrigin("https://preview.example.com")).toBe(
        true,
      );
      expect(isAllowedGreenGlobePreviewParentOrigin("https://random.vercel.app")).toBe(
        false,
      );
      expect(isAllowedGreenGlobePreviewParentOrigin("http://localhost:3001")).toBe(
        false,
      );
    } finally {
      if (originalOrigins === undefined) {
        delete process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS;
      } else {
        process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS = originalOrigins;
      }
    }
  });

  it("falls back to local/deploy origins when no allowlist is configured", () => {
    const originalOrigins = process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS;
    delete process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS;

    try {
      expect(isAllowedGreenGlobePreviewParentOrigin("http://localhost:3001")).toBe(
        true,
      );
      expect(isAllowedGreenGlobePreviewParentOrigin("https://branch.vercel.app")).toBe(
        true,
      );
      expect(isAllowedGreenGlobePreviewParentOrigin("https://example.com")).toBe(
        false,
      );
    } finally {
      if (originalOrigins !== undefined) {
        process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS = originalOrigins;
      }
    }
  });

  it("supports the legacy focus-tree message", () => {
    expect(
      previewStateFromMessage(
        {
          type: LEGACY_GREEN_GLOBE_PREVIEW_FOCUS_TREE_MESSAGE_TYPE,
          datasetRef: datasetOne,
          treeUri: "at://did:plc:org/app.gainforest.dwc.occurrence/tree-1",
        },
        projectDid,
      ),
    ).toEqual({
      requestId: null,
      state: {
        embedMode: true,
        treeUri: "at://did:plc:org/app.gainforest.dwc.occurrence/tree-1",
        datasetRefs: [datasetOne],
        focusedDatasetRef: datasetOne,
        focusedSiteRef: null,
        previewMode: "only",
      },
    });
  });
});
