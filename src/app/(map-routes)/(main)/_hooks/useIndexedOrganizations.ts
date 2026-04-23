import {
  IndexedOrganization,
  StrictIndexedOrganization,
} from "@/app/api/list-organizations/route";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const useIndexedOrganizations = () => {
  const { data, isLoading, isFetching, isRefetching, error, refetch } =
    useQuery({
      queryKey: ["all-organizations"],
      queryFn: async () => {
        const response = await fetch(
          `/api/list-organizations?info=true&mapPoint=true`
        );
        return response.json() as Promise<IndexedOrganization[]>;
      },
    });

  const validOrganizations = useMemo(() => {
    if (!data) return undefined;
    return data.filter(
      (organization) =>
        organization.mapPoint !== null && organization.info !== null
    ) as StrictIndexedOrganization[];
  }, [data]);

  return {
    organizations: validOrganizations,
    isLoading,
    isFetching,
    isRefetching,
    error,
    refetch,
  };
};

export default useIndexedOrganizations;
