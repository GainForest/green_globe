"use client";

import Container from "@/components/Container";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { countryToEmoji } from "@/lib/country-emojis";
import LoadingProjectsPage from "./loading";
import { useUserContext } from "@/app/_contexts/User";
import { useBreadcrumbs } from "../_contexts/Breadcrumbs";
import { ProjectMinified } from "@/app/_contexts/User";
import { Plus } from "lucide-react";

const ProjectsGrid = ({ projects }: { projects: ProjectMinified[] }) => {
  const getCountryDetails = (country: string) =>
    Object.keys(countryToEmoji).includes(country)
      ? countryToEmoji[country as keyof typeof countryToEmoji]
      : null;
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.length === 0 && (
        <div className="col-span-full flex items-center justify-center h-64 text-muted-foreground bg-muted/50 rounded-xl p-8">
          No projects found
        </div>
      )}
      {projects.map((project) => {
        const countryDetails = project.country
          ? getCountryDetails(project.country)
          : null;
        return (
          <div
            key={project.project_id}
            className="bg-accent/25 rounded-xl border border-border flex flex-col hover:shadow-md transition-shadow"
          >
            <div className="p-4 flex-grow">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{project.name}</h2>
                <div className="flex items-center">
                  <span className="px-2 py-1 bg-foreground/10 rounded-full text-sm">
                    {countryDetails?.emoji ?? ""}
                    &nbsp;&nbsp;
                    {countryDetails?.name ?? "Unknown Country"}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-sm text-muted-foreground flex-grow">
                {project.short_description}
              </p>
            </div>

            <div className="bg-accent/20 flex items-center gap-2 p-2 border-t border-border/30 justify-between">
              <Link href={`/${project.project_id}`} target="_blank">
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </Link>
              <Link href={`/projects/${project.project_id}`}>
                <Button variant={"secondary"} size="sm">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function ProjectsPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs([{ label: "Projects", href: "/projects" }]);
  }, [setBreadcrumbs]);

  const { backend } = useUserContext();

  if (!backend) {
    return <LoadingProjectsPage />;
  }

  const adminProjects = backend.projects.filter(
    (project) => project.user_role_in_project === "ADMIN"
  );

  const editorProjects = backend.projects.filter((project) => {
    return project.user_role_in_project === "EDITOR";
  });

  return (
    <Container>
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-sm text-muted-foreground">Manage your projects</p>
      </div>

      <h2 className="text-lg font-semibold mt-8 flex items-center justify-between">
        <span>My Projects</span>
        <Link href="/projects/new">
          <Button size={"sm"}>
            <Plus />
            New Project
          </Button>
        </Link>
      </h2>
      <ProjectsGrid projects={adminProjects} />

      <h2 className="text-lg font-semibold mt-8">External Projects</h2>
      <ProjectsGrid projects={editorProjects} />
    </Container>
  );
}
