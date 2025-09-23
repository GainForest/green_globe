"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { BrowserOAuthClient } from "@atproto/oauth-client-browser";
import { OAuthSession } from "@atproto/oauth-client";
import type { OAuthClientMetadataInput } from "@atproto/oauth-types";
import { Agent } from "@atproto/api";

type MinimalProfile = {
  did: string;
  handle?: string;
  displayName?: string;
  avatar?: string;
};



type AtprotoContextValue = {
  agent: Agent | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  userProfile: MinimalProfile | null;
  error: string | null;
  signIn: (handle: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AtprotoContext = createContext<AtprotoContextValue | null>(null);

const FIVE_MINUTES = 5 * 60 * 1000;
const SESSION_REFRESH_BUFFER = 30 * 1000;

function getATProtoConfig() {
  const handleResolver = process.env.NEXT_PUBLIC_ATPROTO_HANDLE_RESOLVER || 'https://bsky.social';
  const allowedServers = process.env.NEXT_PUBLIC_ATPROTO_ALLOWED_AUTH_SERVERS 
    ? process.env.NEXT_PUBLIC_ATPROTO_ALLOWED_AUTH_SERVERS.split(',').map(s => s.trim())
    : ['https://bsky.social'];
  
  return { handleResolver, allowedServers };
}

const { handleResolver: HANDLE_RESOLVER, allowedServers: ALLOWED_AUTH_SERVERS } = getATProtoConfig();

function getAppOrigin() {
  const envOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;

  if (envOrigin) {
    return envOrigin.replace(/\/$/, "");
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }

  throw new Error("Unable to determine application origin");
}


function classifyAuthError(error: unknown): 'stale_session' | 'network' | 'permission' | 'unknown' {
  const msg = String((error as Error)?.message ?? error ?? "").toLowerCase();
  
  if (/invalid[_\s-]?(state|grant|session|authorization)|expired|unknown authorization/i.test(msg)) {
    return 'stale_session';
  }
  
  if (/network|fetch|timeout|connection|dns/i.test(msg)) {
    return 'network';
  }
  
  if (/permission|forbidden|unauthorized|access.*denied/i.test(msg)) {
    return 'permission';
  }
  
  return 'unknown';
}

async function validateClientMetadata(clientId: string): Promise<boolean> {
  try {
    const response = await fetch(clientId, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'Origin': getAppOrigin()
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.status !== 200) return false;

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('application/json')) return false;
    
    const metadata = await response.json();

    const isValid = (
      typeof metadata.client_id === 'string' &&
      metadata.client_id === clientId &&
      typeof metadata.client_name === 'string' &&
      metadata.client_name.length > 0 &&

      metadata.dpop_bound_access_tokens === true &&
      metadata.token_endpoint_auth_method === 'none' &&
      metadata.application_type === 'web' &&

      Array.isArray(metadata.grant_types) &&
      metadata.grant_types.includes('authorization_code') &&
      metadata.grant_types.includes('refresh_token') &&

      Array.isArray(metadata.response_types) &&
      metadata.response_types.includes('code') &&

      Array.isArray(metadata.redirect_uris) &&
      metadata.redirect_uris.length > 0 &&
      metadata.redirect_uris.every((uri: unknown) => typeof uri === 'string' && uri.startsWith('https://')) &&

      typeof metadata.scope === 'string' &&
      metadata.scope.includes('atproto')
    );
    
    return isValid;
  } catch (error) {
    console.warn('Client metadata validation failed:', error);
    return false;
  }
}

export const AtprotoProvider = ({ children }: { children: React.ReactNode }) => {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<MinimalProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<BrowserOAuthClient | null>(null);
  const sessionRef = useRef<OAuthSession | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ensureClient = useCallback(async () => {
    if (clientRef.current) return clientRef.current;
    
    const isProd = process.env.NODE_ENV === "production";
    const origin = getAppOrigin();
    const callback = `${origin}/callback`;
    
    const clientMetadata = isProd
      ? {
          client_id: `${origin}/client-metadata.json`,
          client_name: "Gainforest App",
          client_uri: origin,
          redirect_uris: [callback],
          scope: "atproto transition:generic",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
          application_type: "web",
          dpop_bound_access_tokens: true,
        }
      : {
          client_id: `http://localhost?redirect_uri=${encodeURIComponent("http://127.0.0.1:8910/callback")}&scope=${encodeURIComponent("atproto transition:generic")}`,
          client_name: "Gainforest Dev Client",
          redirect_uris: ["http://127.0.0.1:8910/callback"],
          scope: "atproto transition:generic",
          grant_types: ["authorization_code", "refresh_token"],
          response_types: ["code"],
          token_endpoint_auth_method: "none",
          application_type: "native",
          dpop_bound_access_tokens: true,
        };

    if (isProd) {
      const isValid = await validateClientMetadata(clientMetadata.client_id);
      if (!isValid) {
        throw new Error("Client metadata validation failed. Please check your client-metadata.json file.");
      }
    }
    
    const client = new BrowserOAuthClient({
      handleResolver: HANDLE_RESOLVER,
      clientMetadata: clientMetadata as Readonly<OAuthClientMetadataInput>,
    });
    
    clientRef.current = client;
    return client;
  }, []);

  const hydrateFromSession = useCallback(
    async (session: OAuthSession | null, authServerUrl?: string) => {
      if (!session?.sub) {
        setIsAuthenticated(false);
        setUserProfile(null);
        setAgent(null);
        return;
      }

      const did = session.sub;
      if (!did.startsWith('did:')) {
        throw new Error(`Invalid DID in session: ${did}`);
      }

      if (authServerUrl) {
        try {
          const tokenInfo = await session.getTokenInfo();
          const sessionIss = tokenInfo.iss;

          if (sessionIss !== authServerUrl) {
            throw new Error(`Authorization server mismatch: expected ${authServerUrl}, got ${sessionIss}`);
          }

          if (!ALLOWED_AUTH_SERVERS.includes(sessionIss)) {
            throw new Error(`Unauthorized issuer: ${sessionIss}. Only trusted AT Protocol servers are allowed.`);
          }
        } catch (error) {
          clearState();
          throw new Error(`Authorization server validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      try {
        const tokenInfo = await session.getTokenInfo();
        if (!tokenInfo.scope.includes('atproto')) {
          throw new Error('Session does not include required atproto scope');
        }
      } catch (error) {
        console.warn('Could not validate session scopes:', error);
      }

      const newAgent = new Agent(session.fetchHandler.bind(session));

      sessionRef.current = session;

      setAgent(newAgent);
      setIsAuthenticated(true);

      try {
        const res = await newAgent.app.bsky.actor.getProfile({ actor: did });
        const prof = res.data || {};
        setUserProfile({
          did,
          handle: prof.handle,
          displayName: prof.displayName,
          avatar: prof.avatar,
        });
      } catch (error) {
        console.warn('Failed to fetch user profile:', error);
        setUserProfile({ did });
      }

      if (process.env.NODE_ENV !== "production") {
        (window as Window & { __atprotoClient?: unknown; __atprotoAgent?: unknown; __atprotoSession?: unknown }).__atprotoClient = clientRef.current;
        (window as Window & { __atprotoClient?: unknown; __atprotoAgent?: unknown; __atprotoSession?: unknown }).__atprotoAgent = newAgent;
        (window as Window & { __atprotoClient?: unknown; __atprotoAgent?: unknown; __atprotoSession?: unknown }).__atprotoSession = session;
      }
    },
    []
  );

  const clearState = useCallback(() => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setAgent(null);
    setError(null);
    sessionRef.current = null;
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (process.env.NODE_ENV !== "production") {
      const w = window as Window & { __atprotoClient?: unknown; __atprotoAgent?: unknown; __atprotoSession?: unknown };
      delete w.__atprotoClient;
      delete w.__atprotoAgent;
      delete w.__atprotoSession;
    }
  }, []);

  const finalizeOrRestore = useCallback(async () => {
    try {
      const client = await ensureClient();

      const result = await client.init();
      const session = result?.session ?? null;
      
      if (session) {
        const authServerUrl = session.serverMetadata?.issuer || HANDLE_RESOLVER;
        await hydrateFromSession(session, authServerUrl);
      } else {
        clearState();
      }
      
      setError(null);
    } catch (e: unknown) {
      const msg = String((e as Error)?.message ?? e ?? "OAuth initialization failed");
      const errorType = classifyAuthError(e);
      
      switch (errorType) {
        case 'stale_session':
          try {
            const client = clientRef.current;
            if (client) {
              const restored = await client.initRestore();
              if (restored?.session) {
                await restored.session.signOut();
              }
            }
          } catch (cleanupError) {
            console.warn('Failed to cleanup stale session:', cleanupError);
          }
          clearState();
          setError('Session expired. Please sign in again.');
          break;
          
        case 'network':
          console.warn('Network error during OAuth initialization:', msg);
          setError('Network error. Please check your connection and try again.');
          break;
          
        case 'permission':
          clearState();
          setError('Access denied. Please check your permissions.');
          break;
          
        default:
          setError(msg);
      }
    } finally {
      setIsInitialized(true);
    }
  }, [clearState, ensureClient, hydrateFromSession]);

  useEffect(() => {
    finalizeOrRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !clientRef.current) return;
    
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    refreshTimerRef.current = setInterval(async () => {
      try {
        const session = sessionRef.current;
        if (!session) return;

        const tokenInfo = await session.getTokenInfo('auto');
        const expiresAtMs = tokenInfo.expiresAt?.getTime();

        if (expiresAtMs && (expiresAtMs - Date.now()) < SESSION_REFRESH_BUFFER) {
          await session.getTokenInfo(true);
        }
      } catch (error) {
        console.warn('Session refresh check failed:', error);

        try {
          const client = clientRef.current;
          if (!client) throw new Error('No OAuth client available');
          
          const result = await client.init();
          if (result?.session) {
            const authServerUrl = result.session.serverMetadata?.issuer || HANDLE_RESOLVER;
            await hydrateFromSession(result.session, authServerUrl);
          } else {
            throw new Error('Session restoration failed');
          }
        } catch (restoreError) {
          clearState();
          setError(`Session expired: ${String(restoreError)}`);
        }
      }
    }, FIVE_MINUTES);
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [isAuthenticated, hydrateFromSession, clearState]);

  const signIn = useCallback(async (handle: string) => {
    try {
      const client = await ensureClient();
      setError(null);

      if (!handle || typeof handle !== 'string') {
        throw new Error('Invalid handle provided');
      }

      const cleanHandle = handle.replace(/^@/, '').trim();
      
      if (!cleanHandle) {
        throw new Error('Handle cannot be empty');
      }

      if (typeof client.signIn === 'function') {
        await client.signIn(cleanHandle, {
          scope: 'atproto transition:generic'
        });
      } else {
        throw new Error('SignIn method not available on OAuth client');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(`Sign in failed: ${message}`);
      throw error;
    }
  }, [ensureClient]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const session = sessionRef.current;
      if (session) {
        await session.signOut();
      } else {
        const client = clientRef.current;
        const restored = await client?.initRestore();
        if (restored?.session) {
          await restored.session.signOut();
        }
      }
    } catch (error) {
      console.warn('Error during sign out:', error);
    } finally {
      clearState();
    }
  }, [clearState]);

  const refreshSession = useCallback(async () => {
    setError(null);
    try {
      const session = sessionRef.current;
      if (session) {
        await session.getTokenInfo(true);
      } else {
        await finalizeOrRestore();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(`Session refresh failed: ${message}`);
      clearState();
      throw error;
    }
  }, [finalizeOrRestore, clearState]);

  const value = useMemo<AtprotoContextValue>(
    () => ({ agent, isAuthenticated, isInitialized, userProfile, error, signIn, signOut, refreshSession }),
    [agent, isAuthenticated, isInitialized, userProfile, error, signIn, signOut, refreshSession]
  );

  return <AtprotoContext.Provider value={value}>{children}</AtprotoContext.Provider>;
};

export const useAtproto = () => {
  const ctx = useContext(AtprotoContext);
  if (!ctx) throw new Error("useAtproto must be used within AtprotoProvider");
  return ctx;
};

export default AtprotoProvider;
