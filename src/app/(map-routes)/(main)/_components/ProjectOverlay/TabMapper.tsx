"use client";
import React from "react";
import useProjectOverlayStore from "./store";
import ProjectInfo from "./ProjectInfo";
import AIAssistant from "./AIAssistant";
import Biodiversity from "./Biodiversity";
import Community from "./Community";
import { AppGainforestOrganizationInfo } from "climateai-sdk/lex-api";
const TabMapper = ({
  organization,
}: {
  organization: AppGainforestOrganizationInfo.Record;
}) => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);

  switch (activeTab) {
    case "info":
      return <ProjectInfo organization={organization} />;
    case "ask-ai":
      return <AIAssistant />;
    case "biodiversity":
      return <Biodiversity />;
    case "community":
      return <Community />;
    default:
      return null;
  }
};

export default TabMapper;
