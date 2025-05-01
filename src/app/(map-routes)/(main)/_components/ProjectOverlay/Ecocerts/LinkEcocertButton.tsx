"use client";
import useWearsHat from "@/app/_hooks/use-wears-hat";
import { Button } from "@/components/ui/button";
import QuickTooltip from "@/components/ui/quick-tooltip";
import { GG_HAT_ID } from "@/config/hats";
import { useAppKitAccount } from "@reown/appkit/react";
import React from "react";

const LinkEcocertButton = ({ onClick }: { onClick: () => void }) => {
  const { address } = useAppKitAccount();
  const { data: isProjectOwner } = useWearsHat({
    address: address as `0x${string}` | undefined,
    hatId: GG_HAT_ID,
  });

  let tooltipTextWhenDisabled = null;

  if (address === undefined) {
    tooltipTextWhenDisabled = "Wallet not connected.";
  }

  if (!isProjectOwner) {
    tooltipTextWhenDisabled = "You are not the owner of the project.";
  }

  if (tooltipTextWhenDisabled) {
    return (
      <QuickTooltip tooltipContent={tooltipTextWhenDisabled}>
        <Button
          size={"sm"}
          asChild
          disabled
          className="cursor-not-allowed opacity-50"
        >
          <span>Link Ecocert</span>
        </Button>
      </QuickTooltip>
    );
  }

  return (
    <QuickTooltip tooltipContent={"Link your ecocert to this project."} asChild>
      <Button size={"sm"} onClick={onClick}>
        Link Ecocert
      </Button>
    </QuickTooltip>
  );
};

export default LinkEcocertButton;
