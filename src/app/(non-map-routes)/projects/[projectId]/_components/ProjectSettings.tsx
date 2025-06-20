"use client";
import { useUserContext } from "@/app/_contexts/User";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import React from "react";
import ProjectMembersList from "./ProjectMembersList";

const ProjectSettings = ({ projectId }: { projectId: string }) => {
  const { backend } = useUserContext();

  const projectFromUserObj = backend?.projects.find(
    (p) => p.project_id === projectId
  );

  if (!projectFromUserObj) return null;
  if (projectFromUserObj.user_role_in_project !== "ADMIN") return null;

  return (
    <>
      <h2 className="text-lg font-semibold mt-8">Project Settings</h2>

      <div className="mt-4 space-y-6">
        <ProjectMembersList projectId={projectId} />

        {/* Delete Project Section */}
        <div className="rounded-lg border border-destructive/20 p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-medium">Delete Project</h3>
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4" />
              Delete Project
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectSettings;
