#!/usr/bin/env node

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

/**
 * Setup script for client-metadata.json
 * Replaces placeholders with actual values from environment variables
 * Should be run during deployment/build process
 */

function setupClientMetadata() {
  const clientMetadataPath = path.join(__dirname, '..', 'public', 'client-metadata.json');

  const requiredEnvVars = {
    'NEXT_PUBLIC_APP_ORIGIN': process.env.NEXT_PUBLIC_APP_ORIGIN
  };
  
  const missingVars = Object.entries(requiredEnvVars)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN.replace(/\/$/, '');

  const clientName = process.env.CLIENT_NAME || 'Gainforest App';
  const tosUri = process.env.TOS_URI?.trim();
  const policyUri = process.env.POLICY_URI?.trim();

  const normalizeOptionalUri = (uri) => {
    if (!uri) return null;
    if (/^https?:\/\//i.test(uri)) return uri;

    const prefixed = uri.startsWith('/') ? uri : `/${uri}`;
    return `${appOrigin}${prefixed}`;
  };

  const clientMetadata = {
    client_id: `${appOrigin}/client-metadata.json`,
    application_type: "web",
    client_name: clientName,
    client_uri: appOrigin,
    dpop_bound_access_tokens: true,
    grant_types: ["authorization_code", "refresh_token"],
    redirect_uris: [`${appOrigin}/callback`],
    response_types: ["code"],
    scope: "atproto transition:generic",
    token_endpoint_auth_method: "none",
  };

  const resolvedTos = normalizeOptionalUri(tosUri);
  if (resolvedTos) {
    clientMetadata.tos_uri = resolvedTos;
  }

  const resolvedPolicy = normalizeOptionalUri(policyUri);
  if (resolvedPolicy) {
    clientMetadata.policy_uri = resolvedPolicy;
  }
  
  try {
    fs.writeFileSync(
      clientMetadataPath,
      JSON.stringify(clientMetadata, null, 2),
      'utf8'
    );
    
    console.log(`✅ Client metadata configured successfully:`);
    console.log(`   - Client ID: ${clientMetadata.client_id}`);
    console.log(`   - Redirect URI: ${clientMetadata.redirect_uris[0]}`);
    console.log(`   - Client Name: ${clientMetadata.client_name}`);
    console.log(`   - File: ${clientMetadataPath}`);
    
  } catch (error) {
    console.error(`❌ Failed to write client metadata:`, error.message);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'production' && process.env.FORCE_CLIENT_METADATA_SETUP !== 'true') {
  console.log('ℹ️  Skipping client metadata setup in development environment');
  console.log('   Set FORCE_CLIENT_METADATA_SETUP=true to override this behavior');
  process.exit(0);
}

setupClientMetadata();
