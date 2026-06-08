import { formatOccurrenceEventDate } from "@/lib/occurrence-event-date";
import { TreeFeature } from "../../ProjectOverlay/store/types";

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
    return `${tree?.Height}m`;
  } else if (tree?.height) {
    return `${tree?.height}m`;
  } else {
    return "unknown";
  }
};

export const getTreeDBH = (tree: TreeFeature["properties"]) => {
  if (tree?.DBH) {
    return `${tree?.DBH}cm`;
  } else if (tree?.diameter) {
    return `${tree?.diameter}cm`;
  } else {
    return "unknown";
  }
};

export const getTreeDateOfMeasurement = (tree: TreeFeature["properties"]) => {
  if (tree?.dateOfMeasurement) {
    return tree?.dateOfMeasurement;
  } else if (tree?.datePlanted) {
    return formatOccurrenceEventDate(tree?.datePlanted);
  } else if (tree?.dateMeasured) {
    return formatOccurrenceEventDate(tree?.dateMeasured);
  } else if (tree["FCD-tree_records-tree_time"]) {
    return formatOccurrenceEventDate(tree["FCD-tree_records-tree_time"]);
  } else {
    return "unknown";
  }
};

const isPdsBlobUrl = (url: string): boolean =>
  url.includes("com.atproto.sync.getBlob");

const appendUniquePhoto = (result: string[], url: string | undefined) => {
  if (!url || url.trim() === "" || result.includes(url)) {
    return;
  }

  result.push(url);
};

export const getTreePhotos = (
  tree: TreeFeature["properties"],
  activeProject: string,
  treeID: string,
) => {
  const result: string[] = [];
  if (tree?.tree_photo) {
    return [tree?.tree_photo];
  }

  const primaryPdsPhoto = [tree?.awsUrl, tree?.leafAwsUrl, tree?.barkAwsUrl].find(
    (url): url is string => typeof url === "string" && isPdsBlobUrl(url),
  );
  if (primaryPdsPhoto) {
    appendUniquePhoto(result, primaryPdsPhoto);
    appendUniquePhoto(result, tree?.leafAwsUrl);
    appendUniquePhoto(result, tree?.barkAwsUrl);
    return result;
  }

  if (
    activeProject ==
      "40367dfcbafa0a8d1fa26ff481d6b2609536c0e14719f8e88060a9aee8c8ab0a" &&
    treeID !== "unknown"
  ) {
    return [
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/trees-measured/${treeID}.jpg`,
    ];
  }
  if (tree?.awsUrl) {
    appendUniquePhoto(result, tree?.awsUrl);
  } else if (tree?.koboUrl) {
    appendUniquePhoto(result, tree?.koboUrl);
  }

  if (tree?.leafAwsUrl) {
    appendUniquePhoto(result, tree?.leafAwsUrl);
  } else if (tree?.leafKoboUrl) {
    appendUniquePhoto(result, tree?.leafKoboUrl);
  }

  if (tree?.barkAwsUrl) {
    appendUniquePhoto(result, tree?.barkAwsUrl);
  } else if (tree?.barkKoboUrl) {
    appendUniquePhoto(result, tree?.barkKoboUrl);
  }
  if (result.length == 0) {
    result.push(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/miscellaneous/placeholders/taxa_plants.png`,
    );
  }
  return result;
};
