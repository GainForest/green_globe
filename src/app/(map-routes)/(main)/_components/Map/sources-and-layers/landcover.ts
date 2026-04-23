import { Map } from "mapbox-gl";

export const generateLandcoverSource = () => ({
  type: "raster" as const,
  tiles: [
    `https://services.terrascope.be/wmts/v2?layer=WORLDCOVER_2021_MAP&style=&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}&TIME=2023-04-12`
  ],
  tileSize: 256,
  attribution: `<a target="_top" rel="noopener" href="https://esa-worldcover.org/">ESA WorldCover 2021</a> | <a target="_top" rel="noopener" href="https://gainforest.earth">©2023 GainForest</a>`,
});

export const generateLandcoverLayer = (
  visibility: "none" | "visible"
) => ({
  id: "landCoverLayer",
  type: "raster" as const,
  source: "landCoverSource",
  layout: {
    visibility: visibility,
  },
});

export const addLandcoverSourceAndLayer = (map: Map) => {
  if (!map.getSource("landCoverSource")) {
    const source = generateLandcoverSource();
    map.addSource("landCoverSource", source);
  }

  if (!map.getLayer("landCoverLayer")) {
    const landcoverLayer = generateLandcoverLayer("none");
    map.addLayer(landcoverLayer);
  }
};
