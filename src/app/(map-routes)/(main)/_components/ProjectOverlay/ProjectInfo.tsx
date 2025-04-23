"use client";
import React from "react";
import { Combobox } from "@/components/ui/combobox";
import { Project } from "./store/types";
import useProjectOverlayStore from "./store";
import useNavigation from "../../_features/navigation/use-navigation";

const ProjectSitesSection = () => {
  const projectSitesOptions = useProjectOverlayStore(
    (state) => state.allSitesOptions
  );
  const navigate = useNavigation();
  const siteId = useProjectOverlayStore((state) => state.siteId);
  const setSiteId = useProjectOverlayStore((state) => state.setSiteId);
  const activateSite = useProjectOverlayStore((state) => state.activateSite);

  const handleProjectSiteChange = (siteId: string) => {
    setSiteId(siteId, navigate);
    activateSite(true, navigate);
  };

  if (!projectSitesOptions || projectSitesOptions.length === 0) return null;

  return (
    <section className="flex items-center gap-2">
      <span className="text-muted-foreground font-bold">
        Project Site{projectSitesOptions.length > 1 ? "s" : ""}
      </span>
      {projectSitesOptions.length > 1 ? (
        <Combobox
          options={projectSitesOptions}
          value={siteId ?? undefined}
          onChange={handleProjectSiteChange}
          className="flex-1 max-w-[300px]"
          searchIn="label"
        />
      ) : (
        <span className="text-muted-foreground flex-1 bg-accent px-2 py-1 rounded-md">
          {projectSitesOptions[0].label}
        </span>
      )}
    </section>
  );
};

const ProjectObjectivesSection = ({
  projectData,
}: {
  projectData: Project;
}) => {
  const objectives = projectData.objective?.split(",") || [];
  return (
    <section className="flex flex-col gap-0.5">
      <span className="font-bold">Objective</span>
      <div className="flex flex-wrap gap-2 mt-1">
        {objectives.map((objective) => (
          <span
            key={objective}
            className="px-2 py-1 bg-foreground/10 backdrop-blur-lg rounded-full text-sm"
          >
            {objective}
          </span>
        ))}
      </div>
    </section>
  );
};

const ProjectInfo = ({ projectData }: { projectData: Project }) => {
  return (
    <div className="flex flex-col gap-4">
      <ProjectSitesSection />
      <section className="flex flex-col gap-0.5">
        <span className="font-bold">Description</span>
        <p className="leading-snug">{projectData.longDescription}</p>
      </section>
      <ProjectObjectivesSection projectData={projectData} />
    </div>
  );
};

export default ProjectInfo;
