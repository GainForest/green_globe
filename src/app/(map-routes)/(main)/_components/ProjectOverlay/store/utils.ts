import { toKebabCase } from "@/lib/utils";
import {
  MeasuredTreesGeoJSON,
  NormalizedTreeFeature,
  Project,
  ProjectDataApiResponse,
  ProjectPolygonAPIResponse,
  TreeFeature,
} from "./types";
import { getTreeSpeciesName } from "../../Map/sources-and-layers/measured-trees";

export const fetchProjectData = async (projectId: string) => {
  const endpoint = `${process.env.NEXT_PUBLIC_GAINFOREST_ENDPOINT}/api/graphql`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
                  query {
                    project(id:"${projectId}") {
                      id
                      name
                      country
                      dataDownloadUrl
                      dataDownloadInfo
                      description
                      longDescription
                      stripeUrl
                      discordId
                      lat
                      lon
                      area
                      objective
                      assets {
                        id
                        name
                        classification
                        awsCID
                        shapefile {
                          default
                          isReference
                          shortName
                        }
                      }
                      communityMembers {
                        id
                        firstName
                        lastName
                        priority
                        role
                        bio
                        Wallet {
                          CeloAccounts
                          SOLAccounts
                        }
                        fundsReceived
                        profileUrl
                      }
                      Wallet {
                        CeloAccounts
                        SOLAccounts
                      }
                    }
                  }
                `,
      }),
    });
    const responseData: ProjectDataApiResponse = await response.json();
    if ("project" in responseData.data && responseData.data.project) {
      const project = responseData.data.project;

      // SORALO HARDCODED DATA:
      if (
        project.id ===
        "9744630d6b4cdfdaf687bf289de011c04272d63ecb486ffc91bacde385740208"
      ) {
        const projectClone = structuredClone(project);
        // Remove the shapefiles from the project
        const newAssets = projectClone.assets.filter(
          (asset) => asset.classification !== "Shapefiles"
        );
        // Add the new assets to the project
        newAssets.push(
          {
            id: "shapefile-00001",
            name: "Elangata",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Elangata.geojson",
            shapefile: {
              default: true,
              isReference: false,
              shortName: "Elangata",
            },
          },
          {
            id: "shapefile-00002",
            name: "Enkong u enkare",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Enkong u enkare.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Enkong u enkare",
            },
          },
          {
            id: "shapefile-00003",
            name: "Enkuto",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Enkuto.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Enkuto",
            },
          },
          {
            id: "shapefile-00004",
            name: "Motorok Spring",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Motorok Spring.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Motorok Spring",
            },
          },
          {
            id: "shapefile-00005",
            name: "Ngurman",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Ngurman.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Ngurman",
            },
          },
          {
            id: "shapefile-00006",
            name: "Olorte",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Olorte.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Olorte",
            },
          },
          {
            id: "shapefile-00007",
            name: "Pakase",
            classification: "Shapefiles",
            awsCID: "shapefiles/soralo-hardcoded-sites/Pakase.geojson",
            shapefile: {
              default: false,
              isReference: false,
              shortName: "Pakase",
            },
          }
        );
        projectClone.assets = newAssets;
        return projectClone;
      }
      // END SORALO HARDCODED DATA:

      return project;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const fetchProjectPolygon = async (awsCID: string) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${awsCID}`
    );
    const data: ProjectPolygonAPIResponse = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getProjectSplashImageURLFromProject = (project: Project) => {
  const splashImage = project.assets.find(
    (asset) => asset.classification === "Project Splash"
  );
  if (splashImage?.awsCID) {
    return `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${splashImage?.awsCID}`;
  } else {
    return null;
  }
};

export const fetchMeasuredTreesShapefile = async (
  projectName: string
): Promise<MeasuredTreesGeoJSON | null> => {
  const kebabCaseProjectName = toKebabCase(projectName);

  const endpoint = `shapefiles/${kebabCaseProjectName}-all-tree-plantings.geojson`;
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AWS_STORAGE}/${endpoint}`
    );
    if (response.ok) {
      const result =
        (await response.json()) as MeasuredTreesGeoJSON<TreeFeature>;

      const normalizedFeatures: NormalizedTreeFeature[] = result.features.map(
        (feature, index: number) => ({
          ...feature,
          properties: {
            ...feature.properties,
            species:
              getTreeSpeciesName(feature.properties)?.trim() ?? "Unknown",
            type: "measured-tree",
          },
          id: index,
        })
      );
      const normalizedResult: MeasuredTreesGeoJSON = {
        ...result,
        features: normalizedFeatures,
      };
      return normalizedResult;
    } else {
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
