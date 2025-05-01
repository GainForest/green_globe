import { chainIds, networks } from "@/config/wagmi";
import { HatsClient } from "@hatsprotocol/sdk-v1-core";
import { HatsSubgraphClient } from "@hatsprotocol/sdk-v1-subgraph";
import { createPublicClient, extractChain, http, PublicClient } from "viem";
import { verifyKeyType } from "./utils";

// Initialize clients (you'll need to provide chainId and RPC URL in actual usage)
const initClients = (chainId: number) => {
  const isChainIdSupported = verifyKeyType(chainId, chainIds);
  if (!isChainIdSupported)
    throw new Error(`This chain is not supported. Chain ID: ${chainId}`);

  const chain = extractChain({
    chains: networks,
    id: chainId as (typeof chainIds)[number],
  });

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const hatsClient = new HatsClient({
    chainId,
    publicClient: publicClient as unknown as PublicClient,
  });

  const hatsSubgraphClient = new HatsSubgraphClient({});

  return { hatsClient, hatsSubgraphClient };
};

/**
 * Get the wearer(s) of a specific hat
 * @param chainId - The chain ID where the hat exists
 * @param hatId - The ID of the hat to check
 * @param rpcUrl - RPC URL for the network
 * @returns Array of addresses that wear the hat
 */
export async function getHatWearers(
  chainId: number,
  hatId: bigint
): Promise<string[]> {
  const { hatsSubgraphClient } = initClients(chainId);

  try {
    const wearers = await hatsSubgraphClient.getWearersOfHatPaginated({
      chainId,
      hatId,
      props: {},
      page: 0,
      perPage: 100,
    });

    return wearers.map((wearer) => wearer.id);
  } catch (error) {
    console.error("Error getting hat wearers:", error);
    throw error;
  }
}

/**
 * Check if an address wears a specific hat
 * @param chainId - The chain ID where the hat exists
 * @param hatId - The ID of the hat to check
 * @param address - The address to check
 * @param rpcUrl - RPC URL for the network
 * @returns Boolean indicating if the address wears the hat
 */
export async function checkAddressWearsHat(
  chainId: number,
  hatId: bigint,
  address: `0x${string}`
): Promise<boolean> {
  const { hatsClient } = initClients(chainId);

  try {
    // This will return 1 if the address wears the hat and is eligible, 0 otherwise
    const isWearer = await hatsClient.isWearerOfHat({
      wearer: address,
      hatId,
    });
    return isWearer;
  } catch (error) {
    console.error("Error checking hat wearer:", error);
    throw error;
  }
}
