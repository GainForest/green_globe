import dayjs from "dayjs";
import { Map } from "mapbox-gl";

export const generatePlanetSource = (planetDate: string) => ({
  type: "raster" as const,
  tiles: [`/api/planet-tiles?date=${planetDate}&z={z}&x={x}&y={y}`],
  tileSize: 256,
  attribution: `<a target="_top" rel="noopener" href="https://gainforest.earth">Mosaic Date: ${planetDate}</a> | <a target="_top" rel="noopener" href="https://www.planet.com/nicfi/">Imagery ©2023 Planet Labs Inc</a> | <a target="_top" rel="noopener" href="https://gainforest.earth">©2023 GainForest</a>`,
});

export const generateLandcoverSource = () => ({
  type: "raster" as const,
  tiles: [
    `https://services.terrascope.be/wmts/v2?layer=WORLDCOVER_2021_MAP&style=&tilematrixset=EPSG:3857&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix=EPSG:3857:{z}&TileCol={x}&TileRow={y}&TIME=2023-04-12`
  ],
  tileSize: 256,
  attribution: `<a target="_top" rel="noopener" href="https://esa-worldcover.org/">ESA WorldCover 2021</a> | <a target="_top" rel="noopener" href="https://gainforest.earth">©2023 GainForest</a>`,
});

export const generatePlanetLayer = (
  planetDate: string,
  visibility: "none" | "visible"
) => ({
  id: `planetLayer${planetDate}`,
  type: "raster" as const,
  source: `planetTile${planetDate}`,
  layout: {
    visibility: visibility,
  },
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

const getPlanetDates = (minDate: dayjs.Dayjs, maxDate: dayjs.Dayjs) => {
  const res = [];
  let monthsBetween = maxDate.diff(minDate, "month");
  while (monthsBetween >= 0) {
    res.push(minDate.format("YYYY-MM"));
    minDate = minDate.add(1, "month");
    monthsBetween--;
  }
  return res;
};

export const addHistoricalSatelliteSourceAndLayers = (map: Map) => {
  const minDate = dayjs("2020-09-01");
  const maxDate = dayjs().subtract(6, "week").set("date", 1);

  const planetDates = getPlanetDates(minDate, maxDate);
  planetDates.forEach((planetDate) => {
    if (map.getSource(`planetTile${planetDate}`)) return;
    const source = generatePlanetSource(planetDate);
    map.addSource(`planetTile${planetDate}`, source);
  });

  planetDates.forEach((planetDate) => {
    const visibility = "none";
    if (map.getLayer(`planetLayer${planetDate}`)) return;
    const newPlanetLayer = generatePlanetLayer(planetDate, visibility);
    map.addLayer(newPlanetLayer);
  });
};

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
