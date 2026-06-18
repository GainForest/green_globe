import type { PreviewState } from "./store";
import { normalizePreviewDatasetRefs } from "./params";

export const GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE =
  "gainforest.greenGlobePreview.v1.setDatasetLayers";
export const GREEN_GLOBE_PREVIEW_READY_MESSAGE_TYPE =
  "gainforest.greenGlobePreview.v1.ready";
export const GREEN_GLOBE_PREVIEW_ACK_MESSAGE_TYPE =
  "gainforest.greenGlobePreview.v1.ack";
export const LEGACY_GREEN_GLOBE_PREVIEW_FOCUS_TREE_MESSAGE_TYPE =
  "gainforest.greenGlobePreview.focusTree";

export type GreenGlobePreviewReadyMessage = {
  type: typeof GREEN_GLOBE_PREVIEW_READY_MESSAGE_TYPE;
  version: 1;
  projectDid: string;
  capabilities: string[];
};

export type GreenGlobePreviewAckMessage = {
  type: typeof GREEN_GLOBE_PREVIEW_ACK_MESSAGE_TYPE;
  version: 1;
  projectDid: string;
  requestId: string | null;
  accepted: boolean;
  error?: string;
};

type TimelineDatasetLayer = {
  datasetRef?: unknown;
  siteRef?: unknown;
};

type NormalizedTimelineDatasetLayers = {
  datasetRefs: string[];
  siteRefByDatasetRef: Map<string, string>;
};

type TimelineDatasetLayersMessage = {
  type: typeof GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE;
  version?: unknown;
  source?: unknown;
  requestId?: unknown;
  projectDid?: unknown;
  datasetLayers?: unknown;
  activeDatasetRefs?: unknown;
  focusedDatasetRef?: unknown;
  emptySelection?: unknown;
  treeUri?: unknown;
};

type LegacyFocusTreeMessage = {
  type: typeof LEGACY_GREEN_GLOBE_PREVIEW_FOCUS_TREE_MESSAGE_TYPE;
  datasetRef?: unknown;
  siteRef?: unknown;
  treeUri?: unknown;
};

type PreviewMessageParseResult = {
  requestId: string | null;
  state: PreviewState;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function stringArrayOrNull(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const values: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") {
      return null;
    }
    values.push(item);
  }

  return values;
}

function normalizeDatasetLayers(
  value: unknown,
): NormalizedTimelineDatasetLayers | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const refs: string[] = [];
  const siteRefByDatasetRef = new Map<string, string>();
  for (const item of value) {
    if (!isRecord(item)) {
      return null;
    }

    const datasetRef = stringOrNull((item as TimelineDatasetLayer).datasetRef);
    if (!datasetRef) {
      return null;
    }

    const rawSiteRef = (item as TimelineDatasetLayer).siteRef;
    if (rawSiteRef !== null && rawSiteRef !== undefined) {
      if (!isRecord(rawSiteRef)) {
        return null;
      }

      const siteRefUri = stringOrNull(rawSiteRef.uri);
      const siteRefCid = stringOrNull(rawSiteRef.cid);
      if (!siteRefUri || !siteRefCid) {
        return null;
      }

      siteRefByDatasetRef.set(datasetRef, siteRefUri);
    }

    refs.push(datasetRef);
  }

  return {
    datasetRefs: normalizePreviewDatasetRefs(refs),
    siteRefByDatasetRef,
  };
}

export function buildGreenGlobePreviewReadyMessage(
  projectDid: string,
): GreenGlobePreviewReadyMessage {
  return {
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
  };
}

export function buildGreenGlobePreviewAckMessage(args: {
  projectDid: string;
  requestId: string | null;
  accepted: boolean;
  error?: string;
}): GreenGlobePreviewAckMessage {
  return {
    type: GREEN_GLOBE_PREVIEW_ACK_MESSAGE_TYPE,
    version: 1,
    projectDid: args.projectDid,
    requestId: args.requestId,
    accepted: args.accepted,
    ...(args.error ? { error: args.error } : {}),
  };
}

export function getGreenGlobePreviewRequestId(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  return stringOrNull(value.requestId);
}

export function previewStateFromMessage(
  value: unknown,
  projectDid: string,
): PreviewMessageParseResult | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.type === GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE) {
    const message = value as TimelineDatasetLayersMessage;
    if (
      message.version !== 1 ||
      message.source !== "bumicerts" ||
      message.projectDid !== projectDid
    ) {
      return null;
    }

    const rawActiveDatasetRefs = stringArrayOrNull(message.activeDatasetRefs);
    const datasetLayers = normalizeDatasetLayers(message.datasetLayers);
    if (!rawActiveDatasetRefs || !datasetLayers) {
      return null;
    }

    const allowedDatasetRefs = new Set(datasetLayers.datasetRefs);
    const datasetRefs = normalizePreviewDatasetRefs(rawActiveDatasetRefs);
    if (datasetRefs.some((datasetRef) => !allowedDatasetRefs.has(datasetRef))) {
      return null;
    }

    const rawFocusedDatasetRef = stringOrNull(message.focusedDatasetRef);
    if (rawFocusedDatasetRef && !datasetRefs.includes(rawFocusedDatasetRef)) {
      return null;
    }

    const focusedDatasetRef =
      rawFocusedDatasetRef ?? (datasetRefs.length === 1 ? datasetRefs[0] : null);
    const focusedSiteRef = focusedDatasetRef
      ? (datasetLayers.siteRefByDatasetRef.get(focusedDatasetRef) ?? null)
      : null;
    const treeUri = stringOrNull(message.treeUri);
    const shouldClear = message.emptySelection === "clear";

    return {
      requestId: getGreenGlobePreviewRequestId(message),
      state: {
        embedMode: true,
        treeUri,
        datasetRefs,
        focusedDatasetRef,
        focusedSiteRef,
        previewMode:
          datasetRefs.length > 0 ? "only" : shouldClear ? "none" : "all",
      },
    };
  }

  if (value.type === LEGACY_GREEN_GLOBE_PREVIEW_FOCUS_TREE_MESSAGE_TYPE) {
    const message = value as LegacyFocusTreeMessage;
    const datasetRef = stringOrNull(message.datasetRef);
    const datasetRefs = normalizePreviewDatasetRefs(datasetRef ? [datasetRef] : []);
    const treeUri = stringOrNull(message.treeUri);
    const focusedSiteRef = stringOrNull(message.siteRef);

    return {
      requestId: null,
      state: {
        embedMode: true,
        treeUri,
        datasetRefs,
        focusedDatasetRef: datasetRefs.length === 1 ? datasetRefs[0] : null,
        focusedSiteRef,
        previewMode: datasetRefs.length > 0 ? "only" : "all",
      },
    };
  }

  return null;
}

export function isGreenGlobePreviewSetDatasetLayersMessage(
  value: unknown,
): value is TimelineDatasetLayersMessage {
  return (
    isRecord(value) &&
    value.type === GREEN_GLOBE_PREVIEW_SET_DATASET_LAYERS_MESSAGE_TYPE
  );
}

export function isAllowedGreenGlobePreviewParentOrigin(origin: string): boolean {
  const configuredOrigins =
    process.env.NEXT_PUBLIC_GREEN_GLOBE_PREVIEW_PARENT_ORIGINS?.split(",")
      .map((value) => value.trim().replace(/\/$/, ""))
      .filter(Boolean) ?? [];

  if (configuredOrigins.length > 0) {
    return configuredOrigins.includes(origin);
  }

  try {
    const { hostname } = new URL(origin);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".gainforest.app") ||
      hostname === "gainforest.app" ||
      hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
}
