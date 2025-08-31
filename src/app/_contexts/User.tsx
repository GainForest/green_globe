"use client";

import { backendApiURL } from "@/config/endpoints";
import { usePrivy } from "@privy-io/react-auth";
import { useAtproto } from "../_components/Providers/AtprotoProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

// Bluesky profile type definition
interface BlueskyProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  followersCount?: number;
  followsCount?: number;
  postsCount?: number;
}

export type ProjectMinified = {
  project_id: string;
  name: string;
  country?: string;
  short_description?: string;
  is_published: boolean;
  user_role_in_project: "ADMIN" | "EDITOR";
};

export type Project = Omit<ProjectMinified, "user_role_in_project"> & {
  long_description: string;
  start_date: string; // YYYY-MM-DD
  website: string | null;
  objective: string;
};

type User = {
  backend:
    | {
        first_name: string;
        last_name: string;
        email?: string; // can be empty string as well when we dont have an email in backend
        wallet_address: string;
        is_wallet_verified: boolean;
        country_code: string | null;
        projects: Array<ProjectMinified>;
      }
    | undefined;
  privy: {
    accessToken: string | null;
  };
  bluesky: {
    isAuthenticated: boolean;
    profile: BlueskyProfile | null;
    isInitialized: boolean;
  };
  isPending: boolean;
  error: Error | null;
  refetch: () => void;
};

const UserContext = createContext<User | null>(null);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { getAccessToken } = usePrivy();
  const { isAuthenticated: blueskyAuthenticated, userProfile, isInitialized: blueskyInitialized } = useAtproto();
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey: ["me", token] });
  };

  useEffect(() => {
    getAccessToken().then((token) => {
      setToken(token);
    });
  }, [getAccessToken]);

  const { data, isPending, error } = useQuery({
    queryKey: ["me", token],
    enabled: !!token,
    queryFn: async () => {
      const res = await fetch(`${backendApiURL}/user/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      return (await res.json()) as User["backend"];
    },
  });

  const user = {
    backend: data,
    privy: {
      accessToken: token,
    },
    bluesky: {
      isAuthenticated: blueskyAuthenticated,
      profile: userProfile,
      isInitialized: blueskyInitialized,
    },
    isPending,
    error,
    refetch,
  };

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
