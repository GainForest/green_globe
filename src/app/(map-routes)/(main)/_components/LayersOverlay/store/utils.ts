import { LayersAPIResponse, Layer } from "./types";
import { toKebabCase } from "@/lib/utils";

export const cleanEndpoint = (endpoint: string) => {
  return endpoint.replace(
    /\${process\.env\.(AWS_STORAGE|TITILER_ENDPOINT)}(\/)?/g,
    ""
  );
};

export const fetchLayers = async (): Promise<Layer[]> => {
  let layersData: Layer[] = [];

  try {
    const globalLayersResponse = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/layers/global/layerData.json`
    );
    const globalLayers: LayersAPIResponse = await globalLayersResponse.json();
    layersData = [...globalLayers.layers];
  } catch (error) {
    console.error("Error fetching global layers", error);
    return [];
  }

  layersData = layersData.map((layer) => ({
    ...layer,
    endpoint: cleanEndpoint(layer.endpoint),
  }));

  return layersData;
};

export const fetchProjectSpecificLayers = async (projectName: string) => {
  const kebabCasedProjectName = toKebabCase(projectName);
  try {
    const projectLayerDataResponse = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/layers/${kebabCasedProjectName}/layerData.json`
    );
    const projectLayerData: {
      layers: Layer[];
    } | null = await projectLayerDataResponse.json();
    const layers = projectLayerData?.layers ?? [];
    return layers
      .filter(
        (layer) =>
          !layer.name.includes("DNA") && !layer.name.includes("Raft Deployment")
      )
      .map((layer) => ({
        ...layer,
        endpoint: cleanEndpoint(layer.endpoint),
      }));
  } catch (error) {
    console.error("Error fetching project specific layers", error);
    return null;
  }
};
