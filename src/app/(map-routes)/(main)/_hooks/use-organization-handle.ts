import { agentForDid } from "@/lib/atproto/pds";
import { useQuery } from "@tanstack/react-query";

type OrganizationHandleResult = {
  handle: string | null;
  slug: string | null;
  isLoading: boolean;
  error: Error | null;
};

const useOrganizationHandle = (did: string | null | undefined): OrganizationHandleResult => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["organization-handle", did],
    queryFn: async () => {
      const agent = await agentForDid(did!);
      const response = await agent.com.atproto.repo.describeRepo({
        repo: did!,
      });
      return response.data.handle ?? null;
    },
    enabled: Boolean(did),
    staleTime: Infinity,
  });

  const handle = data ?? null;
  const slug = handle ? handle.split(".")[0] : null;

  return {
    handle,
    slug,
    isLoading,
    error: error as Error | null,
  };
};

export default useOrganizationHandle;
export { useOrganizationHandle };
