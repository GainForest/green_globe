import {
  CircleLayerSpecification,
  GeoJSONSourceSpecification,
  Map,
} from "mapbox-gl";
import dayjs from "dayjs";
import { TreeFeature } from "../../ProjectOverlay/store/types";

export const treesSource: GeoJSONSourceSpecification = {
  type: "geojson",
  data: {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [0, 0],
        },
        properties: {
          data: "Dummy Source for initialization",
        },
      },
    ],
  },
  cluster: true,
  clusterMaxZoom: 15, // Max zoom to cluster points on
  clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
};

export const clusteredTreesLayer: CircleLayerSpecification = {
  id: "clusteredTrees",
  type: "circle" as const,
  source: "trees",
  filter: ["has", "point_count"],
  paint: {
    "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
    "circle-opacity": 0.5,
    "circle-color": "#ff77c1",
    "circle-stroke-color": "#ff77c1",
    "circle-stroke-opacity": 1,
  },
};

export const clusteredTreesCountTextLayer = {
  id: "clusteredTreesCountText",
  type: "symbol" as const,
  source: "trees",
  filter: ["has", "point_count"],
  layout: {
    "text-field": "{point_count_abbreviated}",
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
};

export const unclusteredTreesLayer: CircleLayerSpecification = {
  id: "unclusteredTrees",
  type: "circle",
  source: "trees",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      "#0883fe",
      "#ff77c1",
    ],
    "circle-radius": [
      "case",
      ["boolean", ["feature-state", "hover"], false],
      8,
      4,
    ],
    "circle-stroke-width": 1,
    "circle-stroke-color": "#000000",
  },
};

export const addMeasuredTreesSourceAndLayer = (map: Map) => {
  if (!map.getSource("trees")) {
    map.addSource("trees", treesSource);
  }
  if (!map.getLayer("clusteredTrees")) {
    map.addLayer(clusteredTreesLayer);
  }
  if (!map.getLayer("clusteredTreesCountText")) {
    map.addLayer(clusteredTreesCountTextLayer);
  }
  if (!map.getLayer("unclusteredTrees")) {
    map.addLayer(unclusteredTreesLayer);
  }
};

export const toggleMeasuredTreesLayer = (
  map: mapboxgl.Map,
  visibility: "visible" | "none"
) => {
  if (map.getLayer("clusteredTrees")) {
    map.setLayoutProperty("clusteredTrees", "visibility", visibility);
  }
  if (map.getLayer("clusteredTreesCountText")) {
    map.setLayoutProperty("clusteredTreesCountText", "visibility", visibility);
  }
  if (map.getLayer("unclusteredTrees")) {
    map.setLayoutProperty("unclusteredTrees", "visibility", visibility);
  }
};

export const getTreeSpeciesName = (tree: TreeFeature["properties"]) => {
  const upperCaseEveryWord = (name: string) =>
    name.replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase());
  if (tree?.Plant_Name) {
    return upperCaseEveryWord(tree?.Plant_Name);
  } else if (tree?.species) {
    return tree?.species;
  } else {
    return undefined;
  }
};

export const getTreeHeight = (tree: TreeFeature["properties"]) => {
  if (tree?.Height) {
    // iNaturalist API
    return `${tree?.Height}m`;
  } else if (tree?.height) {
    return `${tree?.height}m`;
  } else {
    return "unknown";
  }
};

export const getTreeDBH = (tree: TreeFeature["properties"]) => {
  if (tree?.DBH) {
    // iNaturalist API
    return `${tree?.DBH}cm`;
  } else if (tree?.diameter) {
    // kobo API
    return `${tree?.diameter}cm`;
  } else {
    return "unknown";
  }
};

export const getTreeDateOfMeasurement = (tree: TreeFeature["properties"]) => {
  if (tree?.dateOfMeasurement) {
    return tree?.dateOfMeasurement;
  } else if (tree?.datePlanted) {
    return dayjs(tree?.datePlanted).format("DD/MM/YYYY");
  } else if (tree?.dateMeasured) {
    return dayjs(tree?.dateMeasured).format("DD/MM/YYYY");
  } else if (tree["FCD-tree_records-tree_time"]) {
    function formatDateTime(input: string) {
      const [datePart, timePart] = input.split(" ");
      const ddmmyyArr = datePart.split("/");
      const [day, month] = ddmmyyArr;
      let [, , year] = ddmmyyArr;
      year = year.length === 2 ? `20${year}` : year;
      const isoDateString = `${year}-${month}-${day}T${timePart}:00`;
      const date = new Date(isoDateString);
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      return formattedDate;
    }
    return formatDateTime(tree["FCD-tree_records-tree_time"]);
  } else {
    return "unknown";
  }
};

export const getTreePhotos = (
  tree: TreeFeature["properties"],
  activeProject: string,
  treeID: string
) => {
  const result = [];
  if (tree?.tree_photo) {
    return [tree?.tree_photo];
  }
  if (
    activeProject ==
      "40367dfcbafa0a8d1fa26ff481d6b2609536c0e14719f8e88060a9aee8c8ab0a" &&
    treeID !== "unknown"
  ) {
    {
      return [
        `${process.env.NEXT_PUBLIC_AWS_STORAGE}/trees-measured/${treeID}.jpg`,
      ];
    }
  }
  if (tree?.awsUrl) {
    result.push(tree?.awsUrl);
  } else if (tree?.koboUrl) {
    result.push(tree?.koboUrl);
  }

  if (tree?.leafAwsUrl) {
    result.push(tree?.leafAwsUrl);
  } else if (tree?.leafKoboUrl) {
    result.push(tree?.leafKoboUrl);
  }

  if (tree?.barkAwsUrl) {
    result.push(tree?.barkAwsUrl);
  } else if (tree?.barkKoboUrl) {
    result.push(tree?.barkKoboUrl);
  }
  if (result.length == 0) {
    result.push(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/miscellaneous/placeholders/taxa_plants.png`
    );
  }
  return result;
};
