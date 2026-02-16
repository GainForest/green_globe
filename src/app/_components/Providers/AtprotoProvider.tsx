"use client";

import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Extend window interface for debugging
declare global {
  interface Window {
    __atprotoClient?: BrowserOAuthClient;
    __atprotoAgent?: Agent;
  }
}

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

interface AtprotoContextType {
  client: BrowserOAuthClient | null;
  agent: Agent | null;
  isInitialized: boolean;
  isAuthenticated: boolean;
  userProfile: BlueskyProfile | null;
  signIn: (handle: string) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
  error: string | null;
}

const AtprotoContext = createContext<AtprotoContextType | undefined>(undefined);

export const useAtproto = () => {
  const context = useContext(AtprotoContext);
  if (context === undefined) {
    throw new Error('useAtproto must be used within an AtprotoProvider');
  }
  return context;
};

export default function AtprotoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<BrowserOAuthClient | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<BlueskyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize the OAuth client
  useEffect(() => {
    console.log('[AtprotoProvider] useEffect triggered:', { isInitializing, isInitialized });

    // Prevent multiple initialization attempts
    if (isInitializing || isInitialized) {
      console.log('[AtprotoProvider] Skipping initialization - already in progress or done');
      return;
    }

    const initClient = async () => {
      try {
        console.log('[AtprotoProvider] Starting client initialization');

        // Debug: Log current localStorage state
        try {
          const localStorageKeys = Object.keys(localStorage).filter(key =>
            key.includes('oauth') || key.includes('atproto') || key.includes('session')
          );
          console.log('[AtprotoProvider] OAuth-related localStorage keys:', localStorageKeys);
        } catch {
          console.warn('[AtprotoProvider] Could not access localStorage for debugging');
        }

        setIsInitializing(true);
        // Check if we're in production or development
        const isProduction = process.env.NODE_ENV === 'production';
        const baseUrl = isProduction
          ? (process.env.NEXT_PUBLIC_APP_ORIGIN || 'https://gainforest.app')
          : 'http://127.0.0.1:8910';

        // Check if this looks like an OAuth callback by examining URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || urlParams.has('error');
        const isCallbackRoute = window.location.pathname === '/callback';

        // If we have OAuth parameters but we're not on the callback route, this might be a problem
        if (hasOAuthParams && !isCallbackRoute) {
          console.warn('OAuth parameters detected but not on callback route, clearing them');
          // Remove OAuth parameters from URL to prevent confusion
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('code');
          newUrl.searchParams.delete('state');
          newUrl.searchParams.delete('error');
          window.history.replaceState({}, '', newUrl.toString());
        }

        const clientMetadata = isProduction
          ? {
              client_id: `${baseUrl}/client-metadata.json`,
              client_name: 'GainForest',
              client_uri: baseUrl,
              logo_uri: `${baseUrl}/assets/logo.webp`,
              tos_uri: baseUrl,
              policy_uri: baseUrl,
              redirect_uris: [`${baseUrl}/callback`] as [string, ...string[]],
              scope: 'atproto transition:generic',
              grant_types: ['authorization_code', 'refresh_token'] as ['authorization_code', 'refresh_token'],
              response_types: ['code'] as ['code'],
              token_endpoint_auth_method: 'none' as const,
              application_type: 'web' as const,
              dpop_bound_access_tokens: true,
            }
          : {
              // Loopback client configuration for development
              client_id: `http://localhost?redirect_uri=${encodeURIComponent(`${baseUrl}/callback`)}&scope=${encodeURIComponent('atproto transition:generic')}`,
              client_name: 'GainForest',
              client_uri: baseUrl,
              redirect_uris: [`${baseUrl}/callback`] as [string, ...string[]],
              scope: 'atproto transition:generic',
              grant_types: ['authorization_code', 'refresh_token'] as ['authorization_code', 'refresh_token'],
              response_types: ['code'] as ['code'],
              token_endpoint_auth_method: 'none' as const,
              application_type: 'web' as const,
              dpop_bound_access_tokens: true,
            };

        const oauthClient = new BrowserOAuthClient({
          handleResolver: process.env.NEXT_PUBLIC_ATPROTO_HANDLE_RESOLVER || 'https://bsky.social',
          clientMetadata,
        });

        setClient(oauthClient);
        
        // Make client available globally
        window.__atprotoClient = oauthClient;

        // Initialize the client and check for existing sessions with retry logic
        const initSessionWithRetry = async (retries = 2) => {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              console.log(`[AtprotoProvider] Session restoration attempt ${attempt}`);
              const result = await oauthClient.init();

              if (result) {
                console.log('[AtprotoProvider] Session restored successfully!');
                const { session } = result;
                const userAgent = new Agent(session);
                setAgent(userAgent);
                setIsAuthenticated(true);

                // Make agent available globally for other parts of the app
                window.__atprotoAgent = userAgent;
                console.log('[AtprotoProvider] Global agent reference set');

                // Fetch user profile with retry logic
                const fetchProfileWithRetry = async (profileRetries = 3) => {
                  for (let profileAttempt = 1; profileAttempt <= profileRetries; profileAttempt++) {
                    try {
                      console.log(`[AtprotoProvider] Profile fetch attempt ${profileAttempt}`);
                      const profile = await userAgent.getProfile({ actor: userAgent.accountDid });
                      setUserProfile(profile.data);
                      console.log('[AtprotoProvider] Profile fetched successfully');
                      return; // Success, exit retry loop
                    } catch (profileError: unknown) {
                      console.error(`Profile fetch attempt ${profileAttempt} failed:`, profileError);

                      if (profileAttempt === profileRetries) {
                        // Last attempt failed, handle gracefully
                        const errorMessage = profileError instanceof Error ? profileError.message : String(profileError);
                        if (errorMessage.includes('scope') || errorMessage.includes('Missing required scope')) {
                          console.warn('Profile fetch failed due to scope permissions, but authentication succeeded');
                          // Set basic user info from session instead
                          setUserProfile({
                            did: session.sub,
                            handle: session.sub, // This might not be the handle, but we can use DID as fallback
                            displayName: 'Authenticated User'
                          });
                        } else {
                          // For other errors, still try to set basic info
                          setUserProfile({
                            did: session.sub,
                            handle: session.sub,
                            displayName: 'Authenticated User'
                          });
                        }
                      } else {
                        // Wait before retrying (exponential backoff)
                        await new Promise(resolve => setTimeout(resolve, profileAttempt * 1000));
                      }
                    }
                  }
                };

                await fetchProfileWithRetry();
                return; // Session restoration successful, exit retry loop
              } else {
                console.log(`[AtprotoProvider] No existing session found on attempt ${attempt}`);
                if (attempt === retries) {
                  console.log('[AtprotoProvider] No session found after all retries');
                }
              }
            } catch (sessionError: unknown) {
              console.error(`Session restoration attempt ${attempt} failed:`, sessionError);

              if (attempt === retries) {
                // All attempts failed, throw the error
                throw sessionError;
              } else {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, attempt * 2000));
              }
            }
          }
        };

        try {
          await initSessionWithRetry();
        } catch (initError: unknown) {
          // Handle specific OAuth initialization errors gracefully
          const errorMessage = initError instanceof Error ? initError.message : String(initError);

          if (errorMessage.includes('Unknown authorization session')) {
            console.warn('OAuth session not found, proceeding without existing session');
            // This is expected when there's no valid session to restore
          } else if (errorMessage.includes('callback') || errorMessage.includes('OAuth callback')) {
            console.warn('OAuth callback handling failed, this may be expected if not in callback flow');
            // This might happen if we're not actually in a callback flow
          } else if (errorMessage.includes('Invalid state') || errorMessage.includes('state mismatch')) {
            console.warn('OAuth state validation failed, clearing any stale OAuth data');
            // Clear any stale OAuth data from localStorage or sessionStorage
            try {
              // Clear common OAuth-related keys
              const keysToClear = ['oauth_state', 'oauth_session', 'atproto_oauth'];
              keysToClear.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
              });
            } catch (e) {
              console.warn('Failed to clear OAuth storage:', e);
            }
          } else {
            console.error('Unexpected OAuth initialization error:', initError);
            // For unexpected errors, set error state but don't re-throw
            setError(`OAuth initialization failed: ${errorMessage}`);
          }
          setIsInitializing(false);
        }

        setIsInitialized(true);
        console.log('[AtprotoProvider] Initialization completed successfully');
      } catch (err) {
        console.error('Failed to initialize ATproto client:', err);
        setError('Failed to initialize ATproto client');
        setIsInitialized(true);
        console.log('[AtprotoProvider] Initialization failed, but set isInitialized to true');
      } finally {
        setIsInitializing(false);
        console.log('[AtprotoProvider] Initialization process finished');
      }
    };

    initClient();
  }, [isInitializing, isInitialized]);

  // Listen for session deletion events
  useEffect(() => {
    if (!client) return;

    const handleSessionDeleted = (event: CustomEvent) => {
      console.log('ATproto session deleted:', event.detail);
      setAgent(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      // Clear global references
      window.__atprotoAgent = undefined;
    };

    client.addEventListener('deleted', handleSessionDeleted);

    return () => {
      client.removeEventListener('deleted', handleSessionDeleted);
    };
  }, [client]);

  // Periodic session validation and refresh
  useEffect(() => {
    if (!client || !agent || !isAuthenticated) return;

    const validateSession = async () => {
      try {
        // Try to make a simple API call to validate the session
        await agent.getProfile({ actor: agent.accountDid });
        console.log('[AtprotoProvider] Session validation successful');
      } catch (error) {
        console.warn('[AtprotoProvider] Session validation failed, attempting refresh:', error);

        try {
          // Try to refresh the session
          const refreshedResult = await client.init();
          if (refreshedResult) {
            const { session } = refreshedResult;
            const refreshedAgent = new Agent(session);
            setAgent(refreshedAgent);
            window.__atprotoAgent = refreshedAgent;
            console.log('[AtprotoProvider] Session refreshed successfully');
          } else {
            throw new Error('Session refresh failed - no result returned');
          }
        } catch (refreshError) {
          console.error('[AtprotoProvider] Session refresh failed:', refreshError);
          // If refresh fails, clear the session
          setAgent(null);
          setIsAuthenticated(false);
          setUserProfile(null);
          window.__atprotoAgent = undefined;
        }
      }
    };

    // Validate session every 5 minutes
    const intervalId = setInterval(validateSession, 5 * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [client, agent, isAuthenticated]);

  const signIn = async (handle: string) => {
    if (!client) {
      throw new Error('OAuth client not initialized');
    }

    try {
      setError(null);
      await client.signIn(handle);
      // This will redirect the user, so execution stops here
    } catch (err) {
      console.error('Failed to initiate sign in:', err);
      setError('Failed to initiate sign in');
      throw err;
    }
  };

  const signOut = async () => {
    if (!client) return;

    try {
      // Clear local state
      setAgent(null);
      setIsAuthenticated(false);
      setUserProfile(null);
      setError(null);

      // Clear global references
      window.__atprotoAgent = undefined;

      // The client handles session cleanup automatically
      console.log('Bluesky sign out completed successfully');
    } catch (err) {
      console.error('Failed to sign out:', err);
      setError('Failed to sign out');
    }
  };

  const restoreSession = async () => {
    if (!client) {
      console.warn('[AtprotoProvider] Cannot restore session - client not initialized');
      return;
    }

    try {
      console.log('[AtprotoProvider] Manually attempting session restoration...');
      setError(null);

      // Try to initialize/reinitialize the session
      const result = await client.init();

      if (result) {
        const { session } = result;
        const userAgent = new Agent(session);
        setAgent(userAgent);
        setIsAuthenticated(true);

        // Make agent available globally
        window.__atprotoAgent = userAgent;

        // Fetch user profile
        try {
          const profile = await userAgent.getProfile({ actor: userAgent.accountDid });
          setUserProfile(profile.data);
          console.log('[AtprotoProvider] Session restored successfully with profile');
        } catch (profileError) {
          console.warn('[AtprotoProvider] Session restored but profile fetch failed:', profileError);
          // Set basic user info
          setUserProfile({
            did: session.sub,
            handle: session.sub,
            displayName: 'Authenticated User'
          });
        }
      } else {
        console.warn('[AtprotoProvider] No session found to restore');
        setError('No existing session found');
      }
    } catch (err) {
      console.error('[AtprotoProvider] Manual session restoration failed:', err);
      setError('Failed to restore session');
    }
  };

  const value: AtprotoContextType = {
    client,
    agent,
    isInitialized,
    isAuthenticated,
    userProfile,
    signIn,
    signOut,
    restoreSession,
    error,
  };

  return (
    <AtprotoContext.Provider value={value}>
      {children}
    </AtprotoContext.Provider>
  );
}
