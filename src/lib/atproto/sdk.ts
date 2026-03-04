import { allowedPDSDomains } from "@/config/gainforest-sdk";
import { createClient } from "@supabase/supabase-js";
import {
  createATProtoSDK,
  createSupabaseSessionStore,
  createSupabaseStateStore,
} from "gainforest-sdk/oauth";

export const OAUTH_SCOPE = "atproto transition:generic";

// Create Supabase client with service role key (server-side only!)
// Cast to work around version mismatch between SDK's bundled supabase and ours
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
) as unknown as Parameters<typeof createSupabaseSessionStore>[0];

// Unique identifier for this app in the shared Supabase tables
const APP_ID = "greenglobe";

// Environment detection
const isDev = process.env.NODE_ENV === "development";

/**
 * Resolves the public URL of the app from available environment variables.
 *
 * Priority:
 * 1. VERCEL_BRANCH_URL — stable per-branch URL for preview deploys (auto-set by Vercel)
 * 2. VERCEL_URL — auto-set by Vercel for all deployments
 * 3. Default to http://127.0.0.1:8910 in development mode (loopback OAuth)
 *
 * Throws in production if no URL can be resolved.
 */
export const resolvePublicUrl = (): string => {
  if (process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (isDev) {
    return `http://127.0.0.1:8910`;
  }
  throw new Error(
    "Deploy to Vercel (provides VERCEL_BRANCH_URL / VERCEL_URL automatically) or set VERCEL_BRANCH_URL manually"
  );
};

/**
 * ATProto SDK instance configured for OAuth authentication.
 *
 * This SDK handles:
 * - OAuth authorization flow initiation
 * - OAuth callback processing and token exchange
 * - Session restoration for authenticated API calls
 *
 * Sessions are stored in Supabase (atproto_oauth_session table).
 * Auth flow state is stored temporarily in Supabase (atproto_oauth_state table).
 *
 * Lazily initialised on first use so that missing env vars only throw at
 * runtime (when a request actually hits an auth route), not at build time
 * when Next.js collects page data.
 */
let _atprotoSDK: ReturnType<typeof createATProtoSDK> | undefined;

export function getAtprotoSDK(): ReturnType<typeof createATProtoSDK> {
  if (_atprotoSDK) return _atprotoSDK;

  const PUBLIC_URL = resolvePublicUrl();

  const atprotoJwkPrivate = process.env.ATPROTO_JWK_PRIVATE;
  if (!atprotoJwkPrivate) {
    throw new Error("ATPROTO_JWK_PRIVATE is not set");
  }

  /**
   * Development OAuth Configuration (Loopback Client)
   *
   * RFC 8252 compliant loopback client for local development.
   * - Uses http://localhost (no port) in client ID per RFC 8252
   * - Actual redirect URI uses 127.0.0.1:8910
   * - No client authentication required (token_endpoint_auth_method: "none")
   * - Application type: "native"
   */
  const DEV_OAUTH_CONFIG = {
    clientId: `http://localhost?scope=${encodeURIComponent(OAUTH_SCOPE)}&redirect_uri=${encodeURIComponent(`${PUBLIC_URL}/api/oauth/callback`)}`,
    redirectUri: `${PUBLIC_URL}/api/oauth/callback`,
    jwksUri: `${PUBLIC_URL}/.well-known/jwks.json`,
    jwkPrivate: atprotoJwkPrivate,
    scope: OAUTH_SCOPE,
  };

  /**
   * Production OAuth Configuration (Web Client)
   *
   * Standard web client using client metadata endpoint.
   * - Client ID points to metadata endpoint
   * - Uses private_key_jwt authentication
   * - Application type: "web"
   */
  const PROD_OAUTH_CONFIG = {
    clientId: `${PUBLIC_URL}/client-metadata.json`,
    redirectUri: `${PUBLIC_URL}/api/oauth/callback`,
    jwksUri: `${PUBLIC_URL}/.well-known/jwks.json`,
    jwkPrivate: atprotoJwkPrivate,
    scope: OAUTH_SCOPE,
  };

  _atprotoSDK = createATProtoSDK({
    oauth: isDev ? DEV_OAUTH_CONFIG : PROD_OAUTH_CONFIG,
    servers: {
      pds: `https://${allowedPDSDomains[0]}`,
    },
    storage: {
      sessionStore: createSupabaseSessionStore(supabase, APP_ID),
      stateStore: createSupabaseStateStore(supabase, APP_ID),
    },
  });

  return _atprotoSDK;
}

/**
 * @deprecated Use `getAtprotoSDK()` instead. This export is kept for
 * backwards compatibility but will be removed in a follow-up.
 */
export const atprotoSDK = new Proxy({} as ReturnType<typeof createATProtoSDK>, {
  get(_target, prop) {
    return getAtprotoSDK()[prop as keyof ReturnType<typeof createATProtoSDK>];
  },
});
