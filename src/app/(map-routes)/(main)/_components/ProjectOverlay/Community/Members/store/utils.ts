import { PaginatedApiResponse } from "@/lib/types";
import { CommunityMember } from "./types";

export const fetchCommunityMembers = async (projectId: string) => {
  try {
    const response = await fetch(`/api/users?projectId=${projectId}`);
    const data: PaginatedApiResponse<CommunityMember> = await response.json();
    if (data.success === true) {
      return data.data;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error(error);
    return null;
  }
};
