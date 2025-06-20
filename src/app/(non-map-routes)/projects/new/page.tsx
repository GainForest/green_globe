"use client";
import React, { useEffect } from "react";
import ProjectForm from "../[projectId]/_components/ProjectForm";
import Container from "@/components/Container";
import { useBreadcrumbs } from "../../_contexts/Breadcrumbs";
import { useRouter } from "next/navigation";

const NewProjectPage = () => {
  const today = new Date().toISOString().split("T")[0];
  const { setBreadcrumbs } = useBreadcrumbs();
  const router = useRouter();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: "New Project", href: "/projects/new" },
    ]);
  }, []);

  return (
    <Container>
      <div>
        <h1 className="text-2xl font-bold">New Project</h1>
        <p className="text-sm text-muted-foreground">
          Fill the form below to create a new project.
        </p>

        <ProjectForm
          mode="new"
          initialProjectData={{
            project_id: "",
            name: "",
            long_description: "",
            start_date: today,
            website: null,
            objective: "",
          }}
          onSuccess={() => router.push("/projects")}
        />
      </div>
    </Container>
  );
};

export default NewProjectPage;
