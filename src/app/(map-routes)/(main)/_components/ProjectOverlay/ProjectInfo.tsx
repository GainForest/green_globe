"use client";
import React from "react";
import { Combobox } from "@/components/ui/combobox";
import useProjectOverlayStore from "./store";
import useNavigation from "../../_features/navigation/use-navigation";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";
import LinearDocumentRenderer from "@/components/LinearDocumentRenderer";
import type * as PubLeafletPagesLinearDocument from "@/../lexicon-api/types/pub/leaflet/pages/linearDocument";

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
    <section className="flex items-center gap-2" data-testid="project-sites-section">
      <span className="text-muted-foreground font-bold">
        Project Site{projectSitesOptions.length > 1 ? "s" : ""}
      </span>
      {projectSitesOptions.length > 1 ?
        <div data-testid="project-site-combobox" className="flex-1 max-w-[300px]">
          <Combobox
            options={projectSitesOptions}
            value={siteId ?? undefined}
            onChange={handleProjectSiteChange}
            className="w-full"
            searchIn="label"
          />
        </div>
      : <span className="text-muted-foreground flex-1 bg-accent px-2 py-1 rounded-md">
          {projectSitesOptions[0].label}
        </span>
      }
    </section>
  );
};

const ProjectObjectivesSection = ({ objectives }: { objectives: string[] }) => {
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

const ProjectInfo = ({
  organization,
}: {
  organization: AppGainforestOrganizationInfo.Record;
}) => {
  return (
    <div className="flex flex-col gap-4" data-testid="project-info">
      <ProjectSitesSection />
      <section className="flex flex-col gap-0.5" data-testid="project-description">
        <span className="font-bold">Description</span>
        {typeof organization.longDescription === "string" ? (
          <p className="leading-snug">{organization.longDescription}</p>
        ) : organization.longDescription != null ? (
          <LinearDocumentRenderer
            document={
              organization.longDescription as PubLeafletPagesLinearDocument.Main
            }
          />
        ) : null}
      </section>
      <div data-testid="project-objectives">
        <ProjectObjectivesSection objectives={organization.objectives} />
      </div>
    </div>
  );
};

export default ProjectInfo;
