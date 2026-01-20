import React, { useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers, LocateFixed } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import useBlurAnimate from "../../_hooks/useBlurAnimate";
import HistoricalSatelliteControls from "./HistoricalSatelliteControls";
import useLayersOverlayStore from "./store";
import { DynamicLayer } from "./store/types";
import useProjectOverlayStore from "../ProjectOverlay/store";
import { toKebabCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import QuickTooltip from "@/components/ui/quick-tooltip";
import useMapStore from "../Map/store";
import LandcoverControls from "./LandcoverControls";
import useNavigation from "@/app/(map-routes)/(main)/_features/navigation/use-navigation";
import { trpcApi } from "@/components/providers/TRPCProvider";
import { allowedPDSDomains } from "@/config/climateai-sdk";
import { cleanEndpoint } from "./store/utils";

const LayersOverlay = () => {
  const { animate, onAnimationComplete } = useBlurAnimate(
    { opacity: 1, scale: 1, filter: "blur(0px)" },
    { opacity: 1, scale: 1, filter: "unset" }
  );

  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { data: projectLayersResponse } =
    trpcApi.gainforest.organization.layer.getAll.useQuery(
      {
        did: projectId ?? "",
        pdsDomain: allowedPDSDomains[0],
      },
      {
        enabled: !!projectId,
      }
    );
  const toggledOnLayerIds = useLayersOverlayStore(
    (state) => state.toggledOnLayerIds
  );
  const setToggledOnLayerIds = useLayersOverlayStore(
    (actions) => actions.setToggledOnLayerIds
  );

  const navigate = useNavigation();
  const toggleLayer = useCallback(
    (layerName: string, value: boolean) => {
      const tempToggledOnLayerIds = new Set(toggledOnLayerIds);
      if (value) {
        tempToggledOnLayerIds.add(layerName);
      } else {
        tempToggledOnLayerIds.delete(layerName);
      }
      setToggledOnLayerIds([...tempToggledOnLayerIds], navigate);
    },
    [toggledOnLayerIds, setToggledOnLayerIds]
  );

  const categorizedDynamicLayers = useLayersOverlayStore(
    (state) => state.categorizedDynamicLayers
  );
  const fetchCategorizedDynamicLayers = useLayersOverlayStore(
    (actions) => actions.fetchCategorizedDynamicLayers
  );

  const projectSpecificLayers = useLayersOverlayStore(
    (state) => state.projectSpecificLayers
  );
  const setProjectSpecificLayersLoading = useLayersOverlayStore(
    (actions) => actions.setProjectSpecificLayersLoading
  );
  const setProjectSpecificLayers = useLayersOverlayStore(
    (actions) => actions.setProjectSpecificLayers
  );
  const clearProjectSpecificLayers = useLayersOverlayStore(
    (actions) => actions.clearProjectSpecificLayers
  );

  const setMapView = useMapStore((actions) => actions.setCurrentView);
  const setMapBounds = useMapStore((actions) => actions.setMapBounds);

  useEffect(() => {
    if (categorizedDynamicLayers.length === 0) {
      fetchCategorizedDynamicLayers();
    }
  }, [categorizedDynamicLayers]);

  useEffect(() => {
    if (!projectId) {
      clearProjectSpecificLayers();
      return;
    }
    setProjectSpecificLayersLoading(projectId);
  }, [projectId, clearProjectSpecificLayers, setProjectSpecificLayersLoading]);

  useEffect(() => {
    if (!projectId) return;
    if (!projectLayersResponse) return;

    const layers: DynamicLayer[] =
      Array.isArray(projectLayersResponse) ?
        projectLayersResponse
          .map((record) => ("value" in record ? record.value : record))
          .map((layer) => {
            if (!layer) return null;
            // Extract endpoint from a few possible fields and clean out env placeholders
            const endpointCandidate =
              ("endpoint" in layer ? layer.endpoint : undefined) ??
              ("url" in layer ? layer.url : undefined) ??
              ("uri" in layer ? layer.uri : undefined) ??
              ("path" in layer ? layer.path : undefined) ??
              ("tileUrl" in layer ? layer.tileUrl : undefined) ??
              ("cogUrl" in layer ? layer.cogUrl : undefined) ??
              ("dataUrl" in layer ? layer.dataUrl : undefined) ??
              ("file" in layer ? layer.file : undefined) ??
              "";
            const endpoint =
              typeof endpointCandidate === "string"
                ? cleanEndpoint(endpointCandidate)
                : "";

            const category =
              "category" in layer && typeof layer.category === "string"
                ? layer.category
                : "project";

            return {
              ...layer,
              endpoint,
              category,
              description: layer.description ?? "",
              // visibility is applied when hydrating into the store
            } as Omit<DynamicLayer, "visible">;
          })
          .filter(
            (layer): layer is DynamicLayer =>
              layer !== null &&
              !layer.name.includes("DNA") &&
              !layer.name.includes("Raft Deployment")
          )
      : [];

    setProjectSpecificLayers(projectId, layers);
  }, [projectId, projectLayersResponse, setProjectSpecificLayers]);

  const handleZoomToProjectSpecificLayer = useCallback(
    (layerEndpoint: string) => {
      if (!layerEndpoint) return;
      setMapView("project");
      fetch(
        `${process.env.NEXT_PUBLIC_TITILER_ENDPOINT}/cog/bounds?url=${encodeURIComponent(layerEndpoint)}`
      )
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (!data) return;
          if (!("bounds" in data)) return;
          if (!Array.isArray(data.bounds)) return;
          setMapBounds(data.bounds as [number, number, number, number]);
        });
    },
    [setMapView, setMapBounds]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      animate={animate}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      onAnimationComplete={onAnimationComplete}
      className="p-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <Layers size={20} />
        <span className="text-xl font-bold">Explore Layers</span>
      </div>

      {/* Monthly Satellite Layer */}
      <HistoricalSatelliteControls />

      {/* Land Cover Layer */}
      <LandcoverControls />

      {categorizedDynamicLayers.map((layerCategory) => {
        const key = Object.keys(layerCategory)[0];
        const layers = layerCategory[key];
        return (
          <div className="mb-6" key={key}>
            <h3 className="text-sm text-muted-foreground font-semibold mb-1 capitalize">
              {key}
            </h3>
            <div className="text-sm flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl">
              {layers.map((layer) => {
                const id = toKebabCase(layer.name);
                return (
                  <div
                    className="flex items-center justify-between p-4"
                    key={id}
                  >
                    <Label htmlFor={id}>{layer.name}</Label>
                    <Switch
                      id={id}
                      checked={layer.visible}
                      onCheckedChange={(value) => {
                        toggleLayer(layer.name, value);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {projectSpecificLayers.status === "loading" ?
        <div className="flex flex-col gap-2">
          <div className="w-full h-12 bg-foreground/10 animate-pulse rounded-xl"></div>
          <div className="w-full h-12 bg-foreground/10 animate-pulse rounded-xl delay-500"></div>
          <div className="w-full h-12 bg-foreground/10 animate-pulse rounded-xl delay-1000"></div>
        </div>
      : (
        projectSpecificLayers.status === "success" &&
        projectSpecificLayers.layers &&
        projectSpecificLayers.layers.length > 0
      ) ?
        <div className="mb-6">
          <h3 className="text-sm text-muted-foreground font-semibold mb-1 capitalize">
            Project Specific Layers
          </h3>
          <div className="text-sm flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl">
            {projectSpecificLayers.layers.map((layer) => {
              const id = toKebabCase(layer.name);
              return (
                <div className="flex items-center justify-between p-4" key={id}>
                  <Label htmlFor={id}>{layer.name}</Label>
                  <div className="flex items-center gap-2">
                    {layer.visible && (
                      <QuickTooltip tooltipContent={"Zoom to layer in map"}>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleZoomToProjectSpecificLayer(layer.endpoint)
                          }
                        >
                          <LocateFixed size={16} />
                        </Button>
                      </QuickTooltip>
                    )}
                    <Switch
                      id={id}
                      checked={layer.visible}
                      onCheckedChange={(value) => {
                        toggleLayer(layer.name, value);
                        if (value) {
                          handleZoomToProjectSpecificLayer(layer.endpoint);
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      : null}
    </motion.div>
  );
};

export default LayersOverlay;
