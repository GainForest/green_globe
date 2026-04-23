/**
 * Extract a CID string from a BlobRef's ref field.
 * Handles:
 * - proper CID strings (baf...)
 * - plain { $link: string } objects
 * - SDK-deserialized CID-ish objects with toString()
 * - Hyperindex Go-serialized refs like: map[Content:BASE64 Number:42]
 * - Hyperindex map[$link:baf...]
 */
export const extractCid = (ref: unknown): string | null => {
  if (!ref) return null;
  if (typeof ref === 'string') {
    return decodeBlobCid(ref);
  }
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
    return decodeBlobCid(str);
  }
  return null;
};

/**
 * Decodes a blob CID from formats returned by Hyperindex or ATProto tooling.
 */
const decodeBlobCid = (ref: string): string | null => {
  if (!ref) return null;

  if (ref.startsWith('baf')) return ref;

  const linkMatch = ref.match(/\$link:([a-z0-9]+)/i);
  if (linkMatch) {
    return linkMatch[1] ?? null;
  }

  const contentMatch = ref.match(/Content:([A-Za-z0-9+/=]+)/);
  if (!contentMatch) return null;

  const base64Data = contentMatch[1];
  const bytes = Uint8Array.from(Buffer.from(base64Data, 'base64'));
  if (bytes.length < 2 || bytes[0] !== 0x00) return null;

  return 'b' + base32Encode(bytes.subarray(1));
};

/** RFC 4648 base32 encoding (lowercase, no padding). */
const base32Encode = (buf: Uint8Array): string => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
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
