export type Layer = {
  name: string;
  type:
    | "geojson_points"
    | "geojson_points_trees"
    | "geojson_line"
    | "choropleth"
    | "choropleth_shannon"
    | "raster_tif"
    | "tms_tile";
  endpoint: string;
  description: string;
  category: string;
  legend?: string;
  tilePattern?: string;
  tileRange?: {
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
};

export type DynamicLayer = Layer & {
  visible: boolean;
};

export type LayersAPIResponse = {
  layers: Layer[];
};
