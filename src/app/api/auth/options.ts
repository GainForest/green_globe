import {
  type SIWESession,
  verifySignature,
  getChainIdFromMessage,
  getAddressFromMessage,
} from "@reown/appkit-siwe";
import { NextAuthOptions } from "next-auth";
import credentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session extends SIWESession {
    address: string;
    chainId: number;
  }

  interface User {
    address?: string;
    chainId?: number;
  }
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (!nextAuthSecret) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

const providers = [
  credentialsProvider({
    name: "Ethereum",
    credentials: {
      message: {
        label: "Message",
        type: "text",
        placeholder: "0x0",
      },
      signature: {
        label: "Signature",
        type: "text",
        placeholder: "0x0",
      },
    },
    async authorize(credentials) {
      try {
        if (!credentials?.message) {
          throw new Error("SiweMessage is undefined");
        }
        const { message, signature } = credentials;
        const address = getAddressFromMessage(message);
        const chainId = getChainIdFromMessage(message);

        const isValid = await verifySignature({
          address,
          message,
          signature,
          chainId,
          projectId,
        });

        if (isValid) {
          return {
            id: `${chainId}:${address}`,
            address,
            chainId: parseInt(chainId, 10),
          };
        }

        return null;
      } catch {
        return null;
      }
    },
  }),
];

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.address = user.address;
        token.chainId = user.chainId;
      }
      return token;
    },
    session({ session, token }) {
      if (!token.sub) {
        return session;
      }

      const [, chainId, address] = token.sub.split(":");
      if (chainId && address) {
        session.address = address;
        session.chainId = parseInt(chainId, 10);
      }

      return session;
    },
  },
  logger: {
    error: (code, ...message) => {
      if (code === "CLIENT_FETCH_ERROR") {
        console.error(code, message);
      }
    },
  },
};
