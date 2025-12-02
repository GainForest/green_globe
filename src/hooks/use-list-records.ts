import ClimateAIAgent from "@/lib/atproto/agent";
import { useQuery } from "@tanstack/react-query";

const useListRecords = (
  lexicon: string,
  did: string | undefined,
  reverse: boolean = false
) => {
  const { data, isPending, isLoading, isPlaceholderData, error } = useQuery({
    queryKey: ["list-records", lexicon],
    queryFn: async () => {
      const data = await ClimateAIAgent.com.atproto.repo.listRecords({
        repo: did ?? "",
        collection: lexicon,
        reverse,
      });
      if (data.success) return data.data.records;
      throw new Error("Failed to list records");
    },
    enabled: !!did,
  });

  return {
    data: isPlaceholderData ? undefined : data,
    isLoading,
    isPending: isPending || isPlaceholderData,
    error: error,
  };
};

export default useListRecords;
