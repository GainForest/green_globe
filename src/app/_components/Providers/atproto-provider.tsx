"use client";

import { useEffect, useRef } from "react";
import { useAtprotoStore } from "@/app/_components/stores/atproto";
import { checkSession, getProfile } from "@/app/_components/actions/oauth";

export function AtprotoProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false);
  const setAuth = useAtprotoStore((state) => state.setAuth);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initSession = async () => {
      try {
        const result = await checkSession();
        if (result.authenticated) {
          const profile = await getProfile(result.did);
          if (!profile) {
            setAuth(null);
            return;
          }

          const validHandle =
            profile.handle && profile.handle !== "handle.invalid"
              ? profile.handle
              : result.handle;

          setAuth({
            did: result.did,
            handle: validHandle,
            displayName: profile.displayName,
            avatar: profile.avatar,
          });
        } else {
          setAuth(null);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setAuth(null);
      }
    };

    initSession();
  }, [setAuth]);

  return <>{children}</>;
}

export default AtprotoProvider;
