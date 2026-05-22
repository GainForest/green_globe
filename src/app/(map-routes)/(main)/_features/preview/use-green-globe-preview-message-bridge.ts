import { useEffect } from "react";
import useProjectOverlayStore from "../../_components/ProjectOverlay/store";
import {
  buildGreenGlobePreviewAckMessage,
  buildGreenGlobePreviewReadyMessage,
  getGreenGlobePreviewRequestId,
  isAllowedGreenGlobePreviewParentOrigin,
  isGreenGlobePreviewSetDatasetLayersMessage,
  previewStateFromMessage,
} from "./messages";
import { previewDatasetRefsEqual } from "./params";
import usePreviewStore, { type PreviewState } from "./store";

function previewStatesEqual(left: PreviewState, right: PreviewState): boolean {
  return (
    left.embedMode === right.embedMode &&
    left.treeUri === right.treeUri &&
    left.focusedDatasetRef === right.focusedDatasetRef &&
    left.focusedSiteRef === right.focusedSiteRef &&
    left.previewMode === right.previewMode &&
    previewDatasetRefsEqual(left.datasetRefs, right.datasetRefs)
  );
}

function getReferrerOrigin(): string | null {
  if (typeof document === "undefined" || !document.referrer) {
    return null;
  }

  try {
    return new URL(document.referrer).origin;
  } catch {
    return null;
  }
}

function postAck(
  source: MessageEventSource | null,
  origin: string,
  args: {
    projectDid: string;
    requestId: string | null;
    accepted: boolean;
    error?: string;
  },
) {
  if (!source || !("postMessage" in source)) {
    return;
  }

  (source as Window).postMessage(buildGreenGlobePreviewAckMessage(args), origin);
}

export function useGreenGlobePreviewMessageBridge(projectDid: string) {
  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) {
      return;
    }

    const parentOrigin = getReferrerOrigin();
    window.parent.postMessage(
      buildGreenGlobePreviewReadyMessage(projectDid),
      parentOrigin ?? "*",
    );

    function handleMessage(event: MessageEvent) {
      if (event.source !== window.parent) {
        return;
      }

      if (!isAllowedGreenGlobePreviewParentOrigin(event.origin)) {
        return;
      }

      const previewResult = previewStateFromMessage(event.data, projectDid);
      if (!previewResult) {
        if (isGreenGlobePreviewSetDatasetLayersMessage(event.data)) {
          postAck(event.source, event.origin, {
            projectDid,
            requestId: getGreenGlobePreviewRequestId(event.data),
            accepted: false,
            error: "invalid-message",
          });
        }
        return;
      }

      const previousPreviewState = usePreviewStore.getState();
      const previewChanged = !previewStatesEqual(
        previousPreviewState,
        previewResult.state,
      );
      usePreviewStore.getState().setPreviewState(previewResult.state);

      const projectStore = useProjectOverlayStore.getState();
      const focusedSiteRef = previewResult.state.focusedSiteRef;
      if (previewChanged && projectStore.projectId === projectDid) {
        const shouldFocusSite =
          previewResult.state.previewMode !== "none" &&
          focusedSiteRef !== null &&
          projectStore.projectDataStatus === "success" &&
          projectStore.atprotoSites.some((site) => site.uri === focusedSiteRef);

        if (shouldFocusSite && focusedSiteRef) {
          projectStore.setSiteId(focusedSiteRef);
          useProjectOverlayStore.getState().activateSite(true);
        } else {
          projectStore.refreshTrees();
        }
      }

      postAck(event.source, event.origin, {
        projectDid,
        requestId: previewResult.requestId,
        accepted: true,
      });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [projectDid]);
}
