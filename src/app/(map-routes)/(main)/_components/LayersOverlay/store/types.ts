export type LegendEntry = {
  label: string;
  color: string;
  value?: string;
};

export type Layer = {
  name: string;
  type:
    | "geojson_points"
    | "geojson_points_trees"
    | "geojson_line"
    | "choropleth"
    | "choropleth_shannon"
    | "raster_tif"
    | "tms_tile"
    | "heatmap"
    | "contour"
    | "satellite_overlay";
  endpoint: string;
  description: string;
  category: string;
  /** Legend entries for the layer. Array format comes from ATProto lexicon. */
  legend?: LegendEntry[];
  isDefault?: boolean;
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
