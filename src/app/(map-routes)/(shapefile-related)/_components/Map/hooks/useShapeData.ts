import useMapStore from "../store";
import useOverlayStore from "../../Overlay/store";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SupportedGeoJSON } from "../store";
import { Feature, FeatureCollection, MultiPolygon } from "geojson";

type UnknownObject = Record<string, unknown>;

interface PotentialFeatureCollection extends UnknownObject {
  type?: unknown;
  features?: unknown[];
}

interface PotentialFeature extends UnknownObject {
  type?: unknown;
  geometry?: {
    type?: unknown;
    coordinates?: unknown[];
  };
  properties?: UnknownObject;
}

const isFeatureCollection = (data: unknown): data is FeatureCollection => {
  const potentialFC = data as PotentialFeatureCollection;
  return (
    !!potentialFC &&
    typeof potentialFC === "object" &&
    potentialFC.type === "FeatureCollection" &&
    Array.isArray(potentialFC.features)
  );
};

const isMultiPolygonFeature = (
  data: unknown
): data is Feature<MultiPolygon> => {
  const potentialFeature = data as PotentialFeature;
  return (
    !!potentialFeature &&
    typeof potentialFeature === "object" &&
    potentialFeature.type === "Feature" &&
    !!potentialFeature.geometry &&
    typeof potentialFeature.geometry === "object" &&
    potentialFeature.geometry.type === "MultiPolygon" &&
    Array.isArray(potentialFeature.geometry.coordinates)
  );
};

const useShapeData = () => {
  const { asyncShapeData, setAsyncShapeData } = useMapStore();
  const { controlsConfig } = useOverlayStore();

  const isViewMode = controlsConfig.mode === "view";
  const source = isViewMode ? controlsConfig.source : null;
  const sourceValue = source?.value ?? "";
  const sourceType = source?.type ?? "";
  const sourceDataFormat = source?.dataFormat ?? "";

  const { data, isFetching, error } = useQuery<SupportedGeoJSON>({
    queryKey: [
      "map",
      "view",
      "shape-data",
      controlsConfig.mode,
      sourceType,
      sourceValue,
      sourceDataFormat,
    ],
    queryFn: async () => {
      if (!isViewMode || !source) {
        throw new Error("No data available.");
      }
      if (source.type === "url" && source.dataFormat === "geojson") {
        const response = await fetch(source.value);
        if (!response.ok) {
          throw new Error("Failed to fetch data.");
        }
        const data = await response.json();

        // Validate the data type
        if (isFeatureCollection(data) || isMultiPolygonFeature(data)) {
          return data;
        }

        throw new Error(
          `Invalid GeoJSON format. Expected FeatureCollection or Feature<MultiPolygon>, got ${
            data.type || "unknown"
          }`
        );
      }
      throw new Error("Invalid source configuration.");
    },
    enabled:
      isViewMode &&
      source?.type === "url" &&
      source?.dataFormat === "geojson" &&
      !!source?.value,
  });

  useEffect(() => {
    if (isFetching) {
      setAsyncShapeData({
        _status: "loading",
        data: null,
      });
    } else if (error) {
      setAsyncShapeData({
        _status: "error",
        data: null,
        error: error.message,
      });
    } else if (data) {
      setAsyncShapeData({
        _status: "success",
        data,
      });
    }
  }, [data, isFetching, error, setAsyncShapeData]);

  return asyncShapeData;
};

export default useShapeData;
