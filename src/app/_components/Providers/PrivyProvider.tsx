"use client";

import { PrivyProvider as PrivyProviderFromSDK } from "@privy-io/react-auth";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

export default function PrivyProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!appId || !clientId) {
    throw new Error("Privy appId and clientId are not set");
  }
  return (
    <PrivyProviderFromSDK
      appId={appId}
      clientId={clientId}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
        },
      }}
    >
      {children}
    </PrivyProviderFromSDK>
  );
}
