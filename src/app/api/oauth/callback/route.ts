import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { atprotoSDK } from "@/lib/atproto/sdk";
import { saveAppSession, Agent } from "gainforest-sdk/oauth";

/**
 * OAuth 2.0 Callback endpoint.
 *
 * This route handles the OAuth callback from the ATProto authorization server.
 * It exchanges the authorization code for access tokens, saves the OAuth session
 * to Supabase, and creates an encrypted cookie with the user's identity.
 *
 * Flow:
 * 1. ATProto auth server redirects here with ?code=...&state=...
 * 2. SDK exchanges code for tokens (with PKCE verification)
 * 3. OAuth session (tokens, DPoP keys) stored in Supabase
 * 4. Handle resolved from DID via identity resolution
 * 5. App session (DID, handle) saved to encrypted cookie
 * 6. User redirected to home page
 */
export async function GET(request: NextRequest) {
  let success = false;

  // Read and immediately delete the return URL cookie before any async work
  // so it is consumed exactly once regardless of success/failure.
  const cookieStore = await cookies();
  const rawReturnTo = cookieStore.get("oauth_return_to")?.value ?? null;
  cookieStore.set("oauth_return_to", "", { path: "/", maxAge: 0 });

  // Security: only allow relative paths to prevent open-redirect attacks
  const returnUrl = rawReturnTo && rawReturnTo.startsWith("/") ? rawReturnTo : null;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Exchange authorization code for OAuth session
    // This validates the state, verifies PKCE, and stores tokens in Supabase
    const session = await atprotoSDK.callback(searchParams);

    // Resolve handle from DID -- OAuthSession only has sub/did, NOT handle
    // Using describeRepo since climateai.org PDS doesn't support resolveIdentity
    const agent = new Agent(session);
    const { data: repo } = await agent.com.atproto.repo.describeRepo({
      repo: session.did,
    });

    // Save user identity (DID + handle) to encrypted cookie so no async
    // resolution is needed on subsequent page loads
    await saveAppSession({
      did: session.did,
      handle: repo.handle,
      isLoggedIn: true,
    });

    success = true;
  } catch (error) {
    console.error("OAuth callback error:", error);
  }

  // Redirects are outside try/catch because Next.js redirect() throws
  // a control-flow exception that must not be caught
  if (success) {
    redirect(returnUrl ?? "/");
  } else {
    redirect("/?error=auth_failed");
  }
}
