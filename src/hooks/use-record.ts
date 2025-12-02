import getRecord from "@/lib/atproto/getRecord";
import { useQuery } from "@tanstack/react-query";
import { ValidationResult } from "@atproto/lexicon";

const useRecord = <V>(
  lexicon: string,
  did: string | undefined,
  rkey: string | undefined,
  validateFn?: (v: V) => ValidationResult<V>
) => {
  const { data, isPending, isLoading, error, isPlaceholderData } = useQuery({
    queryKey: [lexicon, did],
    queryFn: async () => {
      const data = await getRecord(
        did ?? "",
        lexicon,
        rkey ?? "self",
        validateFn
      );
      return data;
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

export default useRecord;
