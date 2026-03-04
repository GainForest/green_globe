#!/usr/bin/env bun

/**
 * Generate a new ES256 JWK (JSON Web Key) for ATProto OAuth authentication.
 * 
 * This script creates a new Elliptic Curve keypair using the P-256 curve (ES256)
 * and outputs it in JWKS (JSON Web Key Set) format without "use" or "key_ops"
 * properties to avoid deprecation warnings.
 * 
 * The public JWKS endpoint will automatically add key_ops: ["verify"] when
 * serving the public key to OAuth authorization servers.
 * 
 * Usage:
 *   bun run generate-jwk
 * 
 * The output should be set as the ATPROTO_JWK_PRIVATE environment variable.
 */

import { generateKeyPair, exportJWK } from "jose";

async function main() {
  console.log("🔐 Generating new ES256 JWK for ATProto OAuth...\n");

  try {
    // Generate ES256 keypair (Elliptic Curve with P-256 curve)
    // Set extractable: true so we can export it as JWK
    const { privateKey } = await generateKeyPair("ES256", { extractable: true });

    // Export the private key to JWK format
    const jwk = await exportJWK(privateKey);

    // Construct JWKS without "use" or "key_ops" properties
    // The public JWKS endpoint will add key_ops: ["verify"] for public keys
    const jwks = {
      keys: [
        {
          ...jwk,
          kid: `greenglobe-${Date.now()}`, // Unique key ID for rotation capability
          alg: "ES256", // Algorithm identifier
          // No "use" or "key_ops" in private key to avoid deprecation warning
        },
      ],
    };

    // Output the JWKS as minified JSON (suitable for environment variable)
    const jwksJson = JSON.stringify(jwks);

    console.log("✅ JWK generated successfully!\n");
    console.log("📋 Set this as your ATPROTO_JWK_PRIVATE environment variable:\n");
    console.log(jwksJson);
    console.log("\n💡 For local: Add to .env.local");
    console.log("💡 For Vercel: Add to Project Settings → Environment Variables\n");
    console.log("⚠️  Keep this secret! Never commit it to git.\n");
  } catch (error) {
    console.error("❌ Error generating JWK:", error);
    process.exit(1);
  }
}

main();
