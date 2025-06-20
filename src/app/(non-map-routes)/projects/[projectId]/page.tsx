"use client";
import Container from "@/components/Container";
import React, { use, useEffect } from "react";
import { useUserContext } from "@/app/_contexts/User";

import { useBreadcrumbs } from "../../_contexts/Breadcrumbs";
import ProjectEditor from "./_components/ProjectEditor";
import ProjectSettings from "./_components/ProjectSettings";

const ProjectPage = ({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) => {
  const { projectId } = use(params);
  const { backend } = useUserContext();

  const projectFromUserObj = backend?.projects.find(
    (p) => p.project_id === projectId
  );
  const userRoleInProject = projectFromUserObj?.user_role_in_project;

  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    const baseBreadcrumbs = [{ label: "Projects", href: "/projects" }];
    const href = `/projects/${projectId}`;
    if (!backend) {
      baseBreadcrumbs.push({
        label: "$loading",
        href,
      });
    } else if (!projectFromUserObj) {
      baseBreadcrumbs.push({
        label: "$error",
        href,
      });
    } else {
      baseBreadcrumbs.push({
        label: projectFromUserObj.name,
        href,
      });
    }
    setBreadcrumbs(baseBreadcrumbs);
  }, [backend, projectFromUserObj, setBreadcrumbs, projectId]);

  return (
    <Container>
      <div>
        <h1 className="text-2xl font-bold">Edit Project</h1>
        <p className="text-sm text-muted-foreground">
          Edit your project details
          {userRoleInProject === "ADMIN" && " and manage your project settings"}
          .
        </p>

        <ProjectEditor
          projectId={projectId}
          key={`project-editor-${projectId}`}
        />
        <ProjectSettings
          projectId={projectId}
          key={`project-settings-${projectId}`}
        />
      </div>
    </Container>
  );
};

export default ProjectPage;
