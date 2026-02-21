"use client";
import React from "react";
import useProjectOverlayStore from "../../store";
import useOrganizationMembers from "@/app/(map-routes)/(main)/_hooks/use-organization-members";
import { getBlobUrl } from "@/lib/atproto/sdk-utils";
import { BadgeDollarSign, CircleAlert, UserCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "./loading";
import ErrorMessage from "../../ErrorMessage";

const Members = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { members, isLoading, error } = useOrganizationMembers(projectId);

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage />;

  // Sort by joinedAt ascending; records without a date go to the end
  const sortedMembers = [...members].sort((a, b) => {
    if (!a.joinedAt && !b.joinedAt) return 0;
    if (!a.joinedAt) return 1;
    if (!b.joinedAt) return -1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

  // Members who receive financial benefits are those with at least one wallet address
  const financialBeneficiariesCount = sortedMembers.filter(
    (m) => m.walletAddresses && m.walletAddresses.length > 0,
  ).length;

  const displayCount =
    financialBeneficiariesCount > 0
      ? financialBeneficiariesCount
      : sortedMembers.length;

  return (
    <div>
      {sortedMembers.length === 0 ? (
        <p className="bg-foreground/10 text-muted-foreground rounded-lg p-4 flex items-center gap-4">
          <CircleAlert size={32} className="shrink-0 opacity-50" />
          <span>
            No community members have been publicly registered to be displayed.
          </span>
        </p>
      ) : (
        <>
          <p className="bg-foreground/10 text-muted-foreground rounded-lg p-4 flex items-center gap-4">
            <BadgeDollarSign size={32} className="shrink-0 opacity-50" />
            <span>
              <b className="text-foreground">
                {displayCount} member
                {displayCount === 1 ? "" : "s"}
              </b>{" "}
              from the local communities{" "}
              {displayCount === 1 ? "is" : "are"} registered to receive
              financial benefits from this project.
            </span>
          </p>
          <div className="flex flex-col gap-2 mt-4">
            {sortedMembers.map((member) => {
              const displayName =
                member.displayName ||
                [member.firstName, member.lastName].filter(Boolean).join(" ") ||
                "Unknown Member";

              const avatarUrl =
                member.profileImage && projectId
                  ? (() => {
                      try {
                        return getBlobUrl(
                          projectId,
                          member.profileImage,
                          "climateai.org",
                        );
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined;

              return (
                <div
                  className="flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl"
                  key={member.uri}
                >
                  <div className="p-4 flex items-center gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || ""} />
                      <AvatarFallback>
                        <UserCircle2 className="w-10 h-10 opacity-20" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="font-medium">{displayName}</p>
                      {member.role && (
                        <p className="text-sm text-muted-foreground">
                          {member.role}
                        </p>
                      )}
                    </div>
                  </div>
                  {member.bio && member.bio.trim() !== "" && (
                    <div className="p-4 text-sm text-muted-foreground">
                      {member.bio}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Members;
