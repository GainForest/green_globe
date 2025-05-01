"use client";
import { checkAddressWearsHat } from "@/lib/hats";
import { useQuery } from "@tanstack/react-query";

const useWearsHat = ({
  address,
  hatId,
}: {
  address: `0x${string}` | undefined;
  hatId: bigint;
}) => {
  const chainId = 42220;
  const { data, isFetching, error } = useQuery({
    queryKey: ["wears-hat", chainId, address, Number(hatId)],
    queryFn: async () => {
      if (address === undefined) return false;
      return checkAddressWearsHat(chainId, hatId, address);
    },
  });
  return { data, isFetching, error };
};

export default useWearsHat;
