import { Map } from "mapbox-gl";

const addTMSTileSourceAndLayer = (
  map: Map,
  layer: { name: string; type: string; endpoint: string }
) => {
  map.addSource(`${process.env.NEXT_PUBLIC_AWS_STORAGE}/${layer.endpoint}`, {
    type: "raster",
    tiles: [layer.endpoint],
    tileSize: 256, // Tile size, usually 256 or 512
    scheme: "tms", // Specify that the tiles are in TMS format
  });

  map.addLayer({
    id: layer.name,
    type: "raster",
    source: layer.name,
  });
};

export default addTMSTileSourceAndLayer;
