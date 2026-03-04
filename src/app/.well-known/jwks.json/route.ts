import { NextResponse } from "next/server";

/**
 * JSON Web Key Set (JWKS) endpoint.
 *
 * This endpoint serves the public keys used for OAuth token endpoint
 * authentication. ATProto authorization servers fetch this to verify
 * the signatures on our client assertion JWTs.
 *
 * Only the public key components are exposed - the private key is
 * kept secret in the ATPROTO_JWK_PRIVATE environment variable.
 *
 */
export async function GET() {
  const rawJwk = process.env.ATPROTO_JWK_PRIVATE;
  if (!rawJwk) {
    return NextResponse.json(
      { error: "ATPROTO_JWK_PRIVATE environment variable is not configured." },
      { status: 500 }
    );
  }

  let privateKey;
  try {
    privateKey = JSON.parse(rawJwk);
  } catch {
    return NextResponse.json(
      { error: "ATPROTO_JWK_PRIVATE contains invalid JSON." },
      { status: 500 }
    );
  }

  // Transform private keys to public keys for OAuth verification:
  // - Remove private component ("d")
  // - Remove any "use" or "key_ops" from private key
  // - Add key_ops: ["verify"] for OAuth server validation
  const keys = (privateKey.keys ?? []).map(
    ({
      d,
      use,
      key_ops,
      ...jwk
    }: {
      d?: string;
      use?: string;
      key_ops?: string[];
      [key: string]: unknown;
    }) => ({
      ...jwk,
      key_ops: ["verify"], // OAuth servers expect this for signature verification
    })
  );

  return NextResponse.json(
    { keys },
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
