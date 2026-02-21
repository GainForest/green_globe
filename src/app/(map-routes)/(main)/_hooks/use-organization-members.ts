"use client";

import { useQuery } from "@tanstack/react-query";
import ClimateAIAgent from "@/lib/atproto/agent";

const MEMBER_COLLECTION = "app.gainforest.organization.member";

export type AtprotoMember = {
  uri: string;
  rkey: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  bio?: string;
  profileImage?: unknown; // blob ref
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
  cid: string;
  value: RawMemberValue;
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
  bio: typeof raw.value.bio === "string" ? raw.value.bio : undefined,
  profileImage: raw.value.profileImage ?? undefined,
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

const fetchAllMemberRecords = async (did: string): Promise<AtprotoMember[]> => {
  const members: AtprotoMember[] = [];
  let cursor: string | undefined;

  do {
    const response = await ClimateAIAgent.com.atproto.repo.listRecords({
      repo: did,
      collection: MEMBER_COLLECTION,
      limit: 100,
      cursor,
    });

    const page = response.data.records as RawMemberRecord[] | undefined;
    if (page?.length) {
      members.push(...page.map(normalizeMemberRecord));
    }

    cursor = response.data.cursor ?? undefined;
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
    queryKey: ["organization-members", did],
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
