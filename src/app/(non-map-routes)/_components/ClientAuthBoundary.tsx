"use client";

import UnauthorizedPage from "./UnauthorizedPage";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect } from "react";
import Container from "@/components/Container";
import { backendApiURL } from "@/config/endpoints";

export default function ClientAuthBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, user, getAccessToken } = usePrivy();

  useEffect(() => {
    if (!user?.wallet) return;
    getAccessToken().then((token) => {
      console.log("token", token);
      if (!token) return;
      fetch(`${backendApiURL}/user/me/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.error("Unable to auth from backend", err);
        });
    });
  }, [user?.wallet, getAccessToken]);

  if (!ready) {
    return (
      <div className="flex gap-2 h-screen w-screen p-2">
        <div className="hidden md:flex h-full w-64 bg-accent/50 animate-pulse rounded-xl flex-col justify-between p-4">
          <div className="flex flex-col gap-2">
            <div className="h-10 w-10 bg-accent animate-pulse rounded-xl"></div>
            <div className="h-10 w-full bg-accent animate-pulse rounded-xl"></div>
          </div>
          <div className="h-20 rounded-xl bg-accent animate-pulse"></div>
        </div>
        <div className="h-full flex-1 bg-accent/50 animate-pulse rounded-xl delay-700">
          <Container>
            <div className="flex flex-col gap-2 mt-8">
              <div className="h-10 w-1/2 bg-accent animate-pulse rounded-xl"></div>
              <div className="h-10 w-1/4 bg-accent animate-pulse rounded-xl"></div>
            </div>
            <div className="mt-8 h-36 bg-accent animate-pulse rounded-xl"></div>
          </Container>
        </div>
      </div>
    );
  }

  if (!authenticated || user?.wallet === undefined) {
    return <UnauthorizedPage />;
  }

  return children;
}
