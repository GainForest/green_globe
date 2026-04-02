"use client";

import { useQuery } from "@tanstack/react-query";
import { hyperindexClient } from "@/lib/hyperindex/client";
import { ORGANIZATION_MEMBER_RECORDS } from "@/lib/hyperindex/queries";
import { hiKeys } from "@/lib/hyperindex/query-keys";
import type { Connection } from "@/lib/hyperindex/types";
import type { SmallImage } from "../../../../../lexicon-api/types/org/hypercerts/defs";

type BlobLink = { $link: string };

export type AtprotoMember = {
  uri: string;
  rkey: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  bio?: string;
  profileImage?: SmallImage;
  expertise?: string[];
  languages?: string[];
  walletAddresses?: Array<{ chain: string; address: string }>;
  joinedAt?: string;
};

type RawMemberValue = {
  displayName?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  role?: unknown;
  bio?: unknown;
  profileImage?: unknown;
  expertise?: unknown;
  languages?: unknown;
  walletAddresses?: unknown;
  joinedAt?: unknown;
  [k: string]: unknown;
};

type RawMemberRecord = {
  uri: string;
  did: string;
  value: RawMemberValue;
};

type HyperindexMemberRecordNode = {
  uri: string;
  did: string;
  value: RawMemberValue;
};

type MemberRecordsResponse = {
  records: Connection<HyperindexMemberRecordNode>;
};

const extractRkey = (uri: string): string => {
  const parts = uri.split("/");
  return parts[parts.length - 1] ?? uri;
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isWalletAddressArray = (
  value: unknown,
): value is Array<{ chain: string; address: string }> =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).chain === "string" &&
      typeof (item as Record<string, unknown>).address === "string",
  );

const isBlobLink = (value: unknown): value is BlobLink =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as { $link?: unknown }).$link === "string";

const decodeBase64 = (base64: string): Uint8Array => {
  const binary = atob(base64);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const base32Encode = (buffer: Uint8Array): string => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
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

const decodeBlobCid = (value: unknown): string | null => {
  if (typeof value === "string") {
    return value;
  }

  if (isBlobLink(value)) {
    return value.$link;
  }

  if (typeof value !== "object" || value === null) {
    return null;
  }

  const content = (value as { Content?: unknown }).Content;
  if (typeof content !== "string") {
    return null;
  }

  const bytes = decodeBase64(content);
  if (bytes.length < 2 || bytes[0] !== 0x00) {
    return null;
  }

  return `b${base32Encode(bytes.subarray(1))}`;
};

const normalizeRichtext = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  return typeof (value as { text?: unknown }).text === "string"
    ? (value as { text: string }).text
    : undefined;
};

const normalizeBlobRef = (
  value: unknown,
): { ref: BlobLink; mimeType: string; size: number } | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const blob = value as {
    ref?: unknown;
    mimeType?: unknown;
    size?: unknown;
  };

  const cid = decodeBlobCid(blob.ref);
  if (!cid) {
    return undefined;
  }

  if (typeof blob.mimeType !== "string" || typeof blob.size !== "number") {
    return undefined;
  }

  return {
    ref: { $link: cid },
    mimeType: blob.mimeType,
    size: blob.size,
  };
};

const normalizeProfileImage = (value: unknown): SmallImage | undefined => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const image = normalizeBlobRef((value as { image?: unknown }).image);
  if (image) {
    return {
      $type: "org.hypercerts.defs#smallImage",
      image,
    } as unknown as SmallImage;
  }

  const legacyRef = normalizeBlobRef((value as { ref?: unknown }).ref);
  if (!legacyRef) {
    return undefined;
  }

  return {
    $type: "org.hypercerts.defs#smallImage",
    image: legacyRef,
  } as unknown as SmallImage;
};

const normalizeMemberRecord = (raw: RawMemberRecord): AtprotoMember => ({
  uri: raw.uri,
  rkey: extractRkey(raw.uri),
  displayName:
    typeof raw.value.displayName === "string"
      ? raw.value.displayName
      : undefined,
  firstName:
    typeof raw.value.firstName === "string" ? raw.value.firstName : undefined,
  lastName:
    typeof raw.value.lastName === "string" ? raw.value.lastName : undefined,
  role: typeof raw.value.role === "string" ? raw.value.role : undefined,
  bio: normalizeRichtext(raw.value.bio),
  profileImage: normalizeProfileImage(raw.value.profileImage),
  expertise: isStringArray(raw.value.expertise)
    ? raw.value.expertise
    : undefined,
  languages: isStringArray(raw.value.languages)
    ? raw.value.languages
    : undefined,
  walletAddresses: isWalletAddressArray(raw.value.walletAddresses)
    ? raw.value.walletAddresses
    : undefined,
  joinedAt:
    typeof raw.value.joinedAt === "string" ? raw.value.joinedAt : undefined,
});

export const fetchAllMemberRecords = async (
  did: string,
): Promise<AtprotoMember[]> => {
  const members: AtprotoMember[] = [];
  let cursor: string | null = null;

  do {
    const response: MemberRecordsResponse = await hyperindexClient.request(
      ORGANIZATION_MEMBER_RECORDS,
      {
        first: 100,
        after: cursor,
      }
    );

    const page = response.records.edges
      .map((edge) => edge.node)
      .filter((record) => record.did === did);

    if (page.length) {
      members.push(...page.map(normalizeMemberRecord));
    }

    cursor = response.records.pageInfo.hasNextPage
      ? response.records.pageInfo.endCursor
      : null;
  } while (cursor);

  return members;
};

type UseOrganizationMembersResult = {
  members: AtprotoMember[];
  isLoading: boolean;
  error: Error | null;
};

const useOrganizationMembers = (
  did: string | null | undefined,
): UseOrganizationMembersResult => {
  const membersQuery = useQuery({
    queryKey: did ? hiKeys.members(did) : [...hiKeys.all, "members", null],
    queryFn: async () => {
      if (!did) return [];
      return fetchAllMemberRecords(did);
    },
    enabled: Boolean(did),
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    error: membersQuery.error as Error | null,
  };
};

export default useOrganizationMembers;
