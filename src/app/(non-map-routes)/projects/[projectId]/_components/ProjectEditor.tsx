"use client";
import React, { useState } from "react";
import ProjectForm from "./ProjectForm";
import { useUserContext } from "@/app/_contexts/User";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Project } from "./ProjectForm";
import ErrorPage from "../../../_components/ErrorPage";
import ProjectFormSkeleton from "./ProjectFormSkeleton";
import { backendApiURL } from "@/config/endpoints";

const ProjectEditor = ({ projectId }: { projectId: string }) => {
  const [resetKey, setResetKey] = useState(0);

  const {
    privy: { accessToken },
  } = useUserContext();
  const queryClient = useQueryClient();

  const {
    data: project,
    isPending,
    error,
  } = useQuery({
    queryKey: ["project", accessToken, projectId],
    enabled: !!accessToken && !!projectId,
    queryFn: async () => {
      const res = await fetch(`${backendApiURL}/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await res.json();
      return data as Project;
    },
  });

  const handleSuccess = () => {
    // Invalidate the project query to refetch latest data
    queryClient.invalidateQueries({
      queryKey: ["project", accessToken, projectId],
    });
    resetForm();
  };

  const resetForm = () => {
    setResetKey((prev) => prev + 1);
  };

  if (error) {
    return (
      <ErrorPage
        error={error}
        title="Failed to load project."
        description="Please try refreshing the page..."
      />
    );
  }

  if (isPending) {
    return <ProjectFormSkeleton />;
  }

  if (!project) {
    return (
      <ErrorPage
        title="An error occurred."
        description="Something went wrong while loading your project. Please try refreshing the page..."
      />
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold mt-8">Project Details</h2>
      <ProjectForm
        initialProjectData={project}
        onSuccess={handleSuccess}
        resetKey={resetKey}
      />
    </>
  );
};

export default ProjectEditor;
