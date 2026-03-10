// DwC-A blob hosting on PDS
// Handles uploading ZIP archives as blobs to the ATProto PDS and constructing public URLs.

import type { Agent } from '@atproto/api'
import { PDS_ENDPOINT } from '@/config/atproto'

// ---------------------------------------------------------------------------
// uploadDwcaBlob
// ---------------------------------------------------------------------------

/**
 * Upload a DwC-A ZIP archive buffer as a blob to the ATProto PDS.
 *
 * The agent must be authenticated before calling this function.
 * The blob is content-addressed — uploading identical content returns the same CID (idempotent).
 *
 * @param agent - Authenticated ATProto agent
 * @param archiveBuffer - ZIP archive as a Uint8Array (not validated here)
 * @returns The blob CID and mimeType from the PDS response
 */
export async function uploadDwcaBlob(
  agent: Agent,
  archiveBuffer: Uint8Array
): Promise<{ cid: string; mimeType: string }> {
  const response = await agent.com.atproto.repo.uploadBlob(archiveBuffer, {
    encoding: 'application/zip',
  })

  const { blob } = response.data
  return {
    cid: blob.ref.toString(),
    mimeType: blob.mimeType,
  }
}

// ---------------------------------------------------------------------------
// buildBlobUrl
// ---------------------------------------------------------------------------

/**
 * Construct the public URL for a PDS-hosted blob.
 *
 * This URL is publicly accessible without authentication and can be registered
 * with GBIF as the DwC-A endpoint.
 *
 * @param did - The DID of the account that owns the blob
 * @param cid - The blob CID returned from uploadDwcaBlob
 * @returns Fully-qualified public URL for the blob
 */
export function buildBlobUrl(did: string, cid: string): string {
  return (
    PDS_ENDPOINT +
    '/xrpc/com.atproto.sync.getBlob?did=' +
    encodeURIComponent(did) +
    '&cid=' +
    encodeURIComponent(cid)
  )
}

// ---------------------------------------------------------------------------
// uploadAndGetUrl
// ---------------------------------------------------------------------------

/**
 * Convenience function: upload a DwC-A archive and return both the CID and public URL.
 *
 * - CID is used for storage in the PDS dataset record (content-addressed reference)
 * - URL is used for GBIF endpoint registration (publicly accessible download link)
 *
 * @param agent - Authenticated ATProto agent
 * @param did - The DID of the account that owns the blob
 * @param archiveBuffer - ZIP archive as a Uint8Array
 * @returns The blob CID and the public URL
 */
export async function uploadAndGetUrl(
  agent: Agent,
  did: string,
  archiveBuffer: Uint8Array
): Promise<{ cid: string; url: string }> {
  const { cid } = await uploadDwcaBlob(agent, archiveBuffer)
  const url = buildBlobUrl(did, cid)
  return { cid, url }
}
