import { Button } from "@/components/ui/button";
import {
  X,
  Users2,
  Loader2,
  CirclePlus,
  AlertCircle,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import EthAvatar from "@/components/eth-avatar";
import { useQuery } from "@tanstack/react-query";
import { useUserContext } from "@/app/_contexts/User";
import ErrorPage from "@/app/(non-map-routes)/_components/ErrorPage";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { backendApiURL } from "@/config/endpoints";

const ProjectMembersListSkeleton = () => {
  return (
    <div className="flex flex-col w-full gap-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          className="w-full bg-accent/50 p-2 gap-2 rounded-lg flex items-center justify-between"
          key={index}
        >
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-full bg-accent animate-pulse"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            ></div>
            <div
              className="h-8 w-32 rounded-lg bg-accent animate-pulse"
              style={{ animationDelay: `${index * 200}ms` }}
            ></div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-20 rounded-lg bg-accent animate-pulse"
              style={{ animationDelay: `${index * 300}ms` }}
            ></div>
            <div
              className="h-8 w-8 rounded-lg bg-accent animate-pulse"
              style={{ animationDelay: `${index * 400}ms` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
};

type MemberRole = "ADMIN" | "EDITOR";
type ProjectMember = {
  email: string;
  wallet_address: string;
  first_name: string;
  last_name: string;
  permission_level: MemberRole;
  privy_did: string;
};

type ListMembersResponse = {
  members: ProjectMember[];
};

type MemberDisplay = {
  primary: string;
  secondary: string;
  privy_did: string;
};

type User = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  privy_did: string;
  profile: null | {
    wallet_address: string;
  };
  projects_summary: unknown[];
  total_projects: number;
  date_joined: string;
  last_login: string;
  is_active: boolean;
};

type UserSearchResponse = {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
  results: User[];
  search_query: string;
};

type DisplayData =
  | {
      type: "user";
      value: User;
    }
  | {
      type: "member";
      value: ProjectMember;
    };

function getMemberDisplayInfo(displayData: DisplayData): MemberDisplay {
  const { first_name, last_name, email, privy_did } = displayData.value;
  let wallet_address = "";

  if (displayData.type === "user") {
    wallet_address = displayData.value.profile?.wallet_address ?? "";
  } else {
    wallet_address = displayData.value.wallet_address;
  }

  const fullName = `${first_name} ${last_name}`.trim();

  const displayInfoMap = [
    [fullName, "Unnamed user"],
    [email, "No email provided"],
    [
      wallet_address !== ""
        ? wallet_address.slice(0, 6) + "..." + wallet_address.slice(-4)
        : "",
      "No wallet address provided",
    ],
  ];

  const primary = displayInfoMap.find((info) => info[0] !== "")?.[0] ?? "";
  const secondary = displayInfoMap.find((info) => info[0] === "")?.[1] ?? "";

  return { primary, secondary, privy_did };
}

interface ProjectMembersListProps {
  projectId: string;
}

function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const roleOptions = [
  { value: "", label: "No Role" },
  { value: "EDITOR", label: "Editor" },
  { value: "ADMIN", label: "Admin" },
];

type MemberRoleUpdateState = {
  status: "idle" | "loading" | "error" | "success";
};

type MemberListItemProps = {
  displayData: DisplayData;
  currentRole: MemberRole | null;
  handleRoleChange: (role: MemberRole | null) => void;
  state: MemberRoleUpdateState | undefined;
  isSoleAdmin?: boolean;
};

const MemberListItem = ({
  displayData,
  currentRole,
  handleRoleChange,
  state,
  isSoleAdmin,
}: MemberListItemProps) => {
  const [roleInCombobox, setRoleInCombobox] = useState<MemberRole | null>(
    currentRole
  );

  // For optimistic updates:
  useEffect(() => {
    if (!state || state.status === "error" || state.status === "idle") {
      setRoleInCombobox(currentRole);
    }
  }, [state, currentRole]);

  const displayInfo = getMemberDisplayInfo(displayData);
  const walletAddress =
    displayData.type === "user"
      ? displayData.value.profile?.wallet_address
      : displayData.value.wallet_address;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 group",
        displayData.type === "member" && "bg-muted/50"
      )}
    >
      <div className="flex items-center gap-3">
        <EthAvatar
          address={
            !walletAddress || walletAddress === ""
              ? "0x0"
              : (walletAddress as `0x${string}`)
          }
          className="size-8"
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">{displayInfo.primary}</span>
          <span className="text-xs text-muted-foreground">
            {displayInfo.secondary}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isSoleAdmin ? (
          <div className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 py-1">
            <Check className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Admin</span>
          </div>
        ) : (
          <>
            <Combobox
              options={roleOptions}
              value={roleInCombobox ?? ""}
              onChange={(value) => {
                handleRoleChange(value === "" ? null : (value as MemberRole));
                setRoleInCombobox(value === "" ? null : (value as MemberRole));
              }}
              className="w-[110px]"
              placeholder={
                displayData.type === "user"
                  ? "No Role"
                  : currentRole ?? "No Role"
              }
              disabled={state?.status === "loading"}
            />
            {displayData.type === "member" && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  handleRoleChange(null);
                  setRoleInCombobox(null);
                }}
                disabled={state?.status === "loading"}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {state?.status === "loading" && (
              <div className="w-4 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {state?.status === "error" && (
              <div
                className="w-4 flex items-center justify-center"
                title="Failed to update member. Please try again."
              >
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            )}
            {state?.status === "success" && (
              <div className="w-4 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-500" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ProjectMembersList = ({ projectId }: ProjectMembersListProps) => {
  const {
    privy: { accessToken },
  } = useUserContext();

  const [newMemberSearchInput, setNewMemberSearchInput] = useState("");
  const [memberRoleUpdateStates, setMemberRoleUpdateStates] = useState<{
    [privy_did: string]: MemberRoleUpdateState;
  }>({});

  const debouncedSearch = useDebounce(newMemberSearchInput, 300);

  const { data: searchResults, isFetching: isSearching } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    enabled: !!accessToken && !!debouncedSearch && debouncedSearch.length > 0,
    queryFn: async () => {
      const res = await fetch(
        `${backendApiURL}/users/?search=${debouncedSearch}&page=1&page_size=5`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) return { results: [] };
      return res.json() as Promise<UserSearchResponse>;
    },
  });

  const {
    data: membersResponse,
    isPending,
    isRefetching,
    error,
    refetch: refetchMembers,
  } = useQuery({
    queryKey: ["project-members", projectId],
    enabled: !!accessToken && !!projectId,
    queryFn: async () => {
      const res = await fetch(
        `${backendApiURL}/projects/${projectId}/list_members/`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch project members");
      }
      return res.json() as Promise<ListMembersResponse>;
    },
  });

  const findUserRole = (user: { privy_did: string }): MemberRole | null => {
    if (!membersResponse?.members) return null;
    const member = membersResponse.members.find(
      (m) => m.privy_did === user.privy_did
    );
    return member?.permission_level ?? null;
  };

  const setMemberRole = async (
    privy_did: string,
    permission_level: MemberRole | null
  ) => {
    // Get current role and return early if it's the same
    const currentRole = findUserRole({ privy_did });
    if (currentRole === permission_level) return;

    const payload = {
      privy_did,
      permission_level,
    };

    setMemberRoleUpdateStates((prev) => ({
      ...prev,
      [privy_did]: {
        status: "loading" as const,
      },
    }));

    try {
      // Determine API endpoint and method based on the operation
      let baseProjectEndpoint = `${backendApiURL}/projects/${projectId}/`;
      let method: string;

      if (currentRole === null && permission_level !== null) {
        // Adding a new member
        baseProjectEndpoint += "add_member/";
        method = "POST";
      } else if (currentRole !== null && permission_level === null) {
        // Removing a member
        baseProjectEndpoint += "remove_member/";
        method = "DELETE";
      } else if (currentRole !== null && permission_level !== null) {
        // Updating member's role
        baseProjectEndpoint += "update_member/";
        method = "PUT";
      } else {
        // No change needed (trying to remove non-existent member)
        return;
      }

      const res = await fetch(baseProjectEndpoint, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update member");

      setMemberRoleUpdateStates((prev) => ({
        ...prev,
        [privy_did]: {
          status: "success" as const,
        },
      }));

      await refetchMembers();

      setTimeout(() => {
        setMemberRoleUpdateStates((prev) => {
          const newState = { ...prev };
          delete newState[privy_did];
          return newState;
        });
      }, 2000);
    } catch (error) {
      console.error("Error updating member role:", error);
      setMemberRoleUpdateStates((prev) => ({
        ...prev,
        [privy_did]: {
          status: "error" as const,
        },
      }));
      setTimeout(() => {
        setMemberRoleUpdateStates((prev) => {
          const newState = { ...prev };
          delete newState[privy_did];
          return newState;
        });
      }, 3000);
    }
  };

  // Check if there's only one admin
  const adminMembers =
    membersResponse?.members?.filter(
      (member) => member.permission_level === "ADMIN"
    ) || [];
  const isSoleAdmin = (privy_did: string) =>
    adminMembers.length === 1 && adminMembers[0].privy_did === privy_did;

  if (error)
    return (
      <ErrorPage
        title="Failed to load project members."
        description="Please try refreshing the page."
      />
    );

  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center gap-2">
        <Users2 className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Project Members</h3>
      </div>

      <div className="mt-4 space-y-2">
        {isPending || isRefetching ? (
          <ProjectMembersListSkeleton />
        ) : error ? (
          <ErrorPage
            title="Failed to load project members."
            description="Please try refreshing the page."
          />
        ) : (
          <div className="flex flex-col rounded-xl border border-border divide-y overflow-hidden">
            {membersResponse?.members?.map((member) => (
              <MemberListItem
                key={member.privy_did}
                displayData={{ type: "member", value: member }}
                currentRole={member.permission_level}
                handleRoleChange={(role) => {
                  setMemberRole(member.privy_did, role);
                }}
                state={memberRoleUpdateStates[member.privy_did]}
                isSoleAdmin={isSoleAdmin(member.privy_did)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="p-2 bg-muted rounded-xl mt-4">
        <div className="flex gap-2 w-full relative">
          {newMemberSearchInput === "" && (
            <CirclePlus className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          )}
          <Input
            value={newMemberSearchInput}
            onChange={(e) => setNewMemberSearchInput(e.target.value)}
            placeholder="Add member by name, email, or wallet address"
            className={cn(
              "w-full bg-background/75",
              newMemberSearchInput === "" && "pl-8"
            )}
          />
        </div>
        <div className="mt-2 rounded-lg overflow-hidden">
          {isSearching ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching for members...</span>
            </div>
          ) : searchResults === undefined ||
            searchResults.results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {newMemberSearchInput === ""
                ? "Start typing to search for a member."
                : "No search results for the keyword."}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border bg-background">
              {searchResults.results.map((user) => (
                <MemberListItem
                  key={user.privy_did}
                  displayData={{ type: "user", value: user }}
                  currentRole={findUserRole({ privy_did: user.privy_did })}
                  handleRoleChange={(role) => {
                    setMemberRole(user.privy_did, role);
                  }}
                  state={memberRoleUpdateStates[user.privy_did]}
                  isSoleAdmin={isSoleAdmin(user.privy_did)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectMembersList;
