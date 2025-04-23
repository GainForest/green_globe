"use client";
import React, { useEffect } from "react";
import useProjectOverlayStore from "../../store";
import useCommunityMembersStore from "./store";
import { BadgeDollarSign, CircleAlert, UserCircle2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "./loading";
import ErrorMessage from "../../ErrorMessage";
const Members = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { data, dataStatus, fetchData } = useCommunityMembersStore();

  useEffect(() => {
    fetchData();
  }, [projectId, fetchData]);

  if (dataStatus === "loading") return <Loading />;
  if (dataStatus === "error") return <ErrorMessage />;

  const { members } = data;

  const sortedMembers = members.sort((a, b) => {
    return (a.display_order ?? Infinity) - (b.display_order ?? Infinity);
  });

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
                {sortedMembers.length} member
                {sortedMembers.length === 1 ? "" : "s"}
              </b>{" "}
              from the local communities{" "}
              {sortedMembers.length === 1 ? "is" : "are"} registered to receive
              financial benefits from this project.
            </span>
          </p>
          <div className="flex flex-col gap-2 mt-4">
            {sortedMembers.map((member) => (
              <div
                className="flex flex-col divide-y bg-neutral-50 dark:bg-neutral-950 border border-border rounded-xl"
                key={member.id}
              >
                <div className="p-4 flex items-center gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.profile_image_url || ""} />
                    <AvatarFallback>
                      <UserCircle2 className="w-10 h-10 opacity-20" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.title}
                    </p>
                  </div>
                </div>
                {member.bio && member.bio.trim() !== "" && (
                  <div className="p-4 text-sm text-muted-foreground">
                    {member.bio}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Members;
