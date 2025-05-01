import { BrowserProvider, ethers, JsonRpcSigner } from "ethers";
import { useMemo } from "react";
import type { WalletClient } from "viem";
import { useWalletClient } from "wagmi";

export function walletClientToSigner(walletClient: WalletClient) {
  const { account, chain, transport } = walletClient;
  const network = {
    chainId: chain?.id,
    name: chain?.name,
    ensAddress: chain?.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);

  if (!account || !account.address) {
    throw new Error("Account address is required to create a signer");
  }

  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

/** Hook to convert a viem Wallet Client to an ethers.js Signer. */
function useEthersSigner({ chainId }: { chainId?: number } = {}) {
  const { data: walletClient } = useWalletClient({ chainId });
  const ethersSigner = useMemo(
    () => (walletClient ? walletClientToSigner(walletClient) : undefined),
    [walletClient]
  );
  if (process.env.NEXT_PUBLIC_DEV_RPC_PRIVATE_KEY) {
    const privateKey = process.env.NEXT_PUBLIC_DEV_RPC_PRIVATE_KEY;
    if (typeof privateKey === "string" && privateKey.length > 0) {
      const provider = new ethers.JsonRpcProvider("http://localhost:8545");
      const wallet = new ethers.Wallet(privateKey, provider);
      return new JsonRpcSigner(provider, wallet.address);
    }
  }
  return ethersSigner;
}

export default useEthersSigner;
