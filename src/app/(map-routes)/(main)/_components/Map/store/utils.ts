import { ProjectPolygonAPIResponse } from "../../ProjectOverlay/store/types";

export const fetchPolygonByURL = async (url: string) => {
  try {
    const response = await fetch(url);
    const data: ProjectPolygonAPIResponse = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
