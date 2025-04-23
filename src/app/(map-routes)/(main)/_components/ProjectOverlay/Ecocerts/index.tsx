"use client";

import { Button } from "@/components/ui/button";
import { GalleryVerticalEnd } from "lucide-react";
import React from "react";
import usePanelsStore from "../../Panels/store";

const Ecocerts = () => {
  const setPanelId = usePanelsStore((state) => state.setPanelId);
  const setBackButtonText = usePanelsStore((state) => state.setBackButtonText);

  const handleAddEcocertButtonClick = () => {
    setPanelId("attestation-creation");
    setBackButtonText("Ecocerts");
  };
  return (
    <div className="w-full flex flex-col items-center p-4 gap-4">
      <GalleryVerticalEnd
        size={80}
        className="text-muted-foreground opacity-50"
      />
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center">
          <span className="font-bold text-lg text-center text-balance">
            No Ecocerts found.
          </span>
          <span className="text-sm text-muted-foreground text-center text-balance">
            There are no Ecocerts associated with this project.
          </span>
        </div>
        <Button size={"sm"} onClick={handleAddEcocertButtonClick}>
          Add Ecocert
        </Button>
      </div>
    </div>
  );
};

export default Ecocerts;
