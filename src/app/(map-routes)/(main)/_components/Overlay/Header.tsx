"use client";

import React from "react";
import Image from "next/image";
import { useStackedDialog } from "@/components/ui/StackedDialog/context";
import { User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";

const Header = ({ showBrandName = true }: { showBrandName?: boolean }) => {
  // const { address } = useAppKitAccount();
  // const { open } = useAppKit();
  const { authenticated, ready } = usePrivy();
  const { openDialog } = useStackedDialog();
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Image
          src="/assets/logo.webp"
          alt="logo"
          width={28}
          height={28}
          className="rounded-full"
        />
        {showBrandName && <span className="font-bold text-lg">GainForest</span>}
      </div>

      {/* Commenting this code to temporarily remove it */}
      {!ready ? (
        <Button variant={"ghost"} size={"icon"}>
          <Loader2 className="animate-spin" />
        </Button>
      ) : authenticated ? (
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button variant={"ghost"} size={"sm"}>
              Projects
            </Button>
          </Link>
          <Button
            variant={"outline"}
            size={"icon"}
            onClick={() => openDialog("account")}
          >
            <User2 />
          </Button>
        </div>
      ) : (
        <Button
          variant={"outline"}
          onClick={() => openDialog("onboarding")}
          size={"sm"}
        >
          Sign in
        </Button>
      )}
    </div>
  );
};

export default Header;
