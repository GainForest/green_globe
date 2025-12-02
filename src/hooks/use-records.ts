import getRecord from "@/lib/atproto/getRecord";
import { useQueries } from "@tanstack/react-query";
import { ValidationResult } from "@atproto/lexicon";

const useRecords = <V>(
  lexicon: string,
  did: string | undefined,
  rkeys: string[],
  validateFn?: (v: V) => ValidationResult<V>
) => {
  const results = useQueries({
    queries: rkeys.map((rkey) => ({
      queryKey: [lexicon, did, rkey],
      queryFn: async () => {
        const data = await getRecord(did ?? "", lexicon, rkey, validateFn);
        return data as V;
      },
      enabled: !!did,
    })),
  });

  const recordResults = results.map((result) => ({
    data: result.isPlaceholderData ? undefined : result.data,
    isLoading: result.isLoading,
    isPending: result.isPending || result.isPlaceholderData,
    error: result.error,
  }));

  return recordResults;
};

export default useRecords;
