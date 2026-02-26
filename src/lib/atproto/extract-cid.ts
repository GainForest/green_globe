/**
 * Extract a CID string from a BlobRef's ref field.
 * Handles both SDK-deserialized CID objects and plain { $link: string } objects.
 */
export const extractCid = (ref: unknown): string | null => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (
    typeof ref === 'object' &&
    '$link' in (ref as Record<string, unknown>)
  ) {
    return (ref as Record<string, unknown>)['$link'] as string;
  }
  if (
    typeof ref === 'object' &&
    typeof (ref as { toString?: unknown }).toString === 'function'
  ) {
    const str = (ref as { toString: () => string }).toString();
    if (str.startsWith('baf')) return str;
  }
  return null;
};

/**
 * Build a PDS blob URL from a DID and CID.
 */
export const buildBlobUrl = (
  pdsEndpoint: string,
  did: string,
  cid: string,
): string =>
  `${pdsEndpoint}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
