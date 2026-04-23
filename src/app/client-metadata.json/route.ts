import { OAUTH_SCOPE, resolvePublicUrl } from "@/lib/atproto/sdk";
import { NextResponse } from "next/server";

/**
 * OAuth 2.0 Client Metadata endpoint.
 *
 * This endpoint serves the OAuth client metadata document required by
 * ATProto authorization servers. It describes this application's OAuth
 * configuration including redirect URIs, supported grant types, and
 * token endpoint authentication method.
 *
 * The metadata returned depends on the environment:
 * - Development: Loopback client (RFC 8252 compliant)
 * - Production: Web client with private_key_jwt authentication
 *
 * @see https://atproto.com/specs/oauth
 */
export async function GET() {
  const isDev = process.env.NODE_ENV === "development";
  const PUBLIC_URL = resolvePublicUrl();

  /**
   * Development Metadata (Loopback Client)
   *
   * RFC 8252 compliant native/loopback client for local development.
   * - Client ID embeds scope and redirect URI
   * - No client authentication (token_endpoint_auth_method: "none")
   * - Application type: "native"
   */
  const DEV_METADATA = {
    client_id: `http://localhost?scope=${encodeURIComponent(OAUTH_SCOPE)}&redirect_uri=${encodeURIComponent(`${PUBLIC_URL}/api/oauth/callback`)}`,
    client_name: "GainForest",
    client_uri: PUBLIC_URL,
    logo_uri: `${PUBLIC_URL}/logo.png`,
    tos_uri: `${PUBLIC_URL}/terms`,
    policy_uri: `${PUBLIC_URL}/privacy`,
    redirect_uris: [`${PUBLIC_URL}/api/oauth/callback`],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: OAUTH_SCOPE,
    token_endpoint_auth_method: "none",
    application_type: "native",
    dpop_bound_access_tokens: true,
    jwks_uri: `${PUBLIC_URL}/.well-known/jwks.json`,
  };

  /**
   * Production Metadata (Web Client)
   *
   * Standard web client using client metadata endpoint.
   * - Client ID points to this metadata endpoint
   * - Uses private_key_jwt authentication with ES256
   * - Application type: "web"
   */
  const PROD_METADATA = {
    client_id: `${PUBLIC_URL}/client-metadata.json`,
    client_name: "GainForest",
    client_uri: PUBLIC_URL,
    logo_uri: `${PUBLIC_URL}/logo.png`,
    tos_uri: `${PUBLIC_URL}/terms`,
    policy_uri: `${PUBLIC_URL}/privacy`,
    redirect_uris: [`${PUBLIC_URL}/api/oauth/callback`],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    scope: OAUTH_SCOPE,
    token_endpoint_auth_method: "private_key_jwt",
    token_endpoint_auth_signing_alg: "ES256",
    application_type: "web",
    dpop_bound_access_tokens: true,
    jwks_uri: `${PUBLIC_URL}/.well-known/jwks.json`,
  };

  const metadata = isDev ? DEV_METADATA : PROD_METADATA;

  return NextResponse.json(metadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
