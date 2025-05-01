"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { User2 } from "lucide-react";

const WalletButton = dynamic(() => import("@/app/_components/WalletButton"), {
  ssr: false,
});

const Header = ({ showBrandName = true }: { showBrandName?: boolean }) => {
  const { address } = useAppKitAccount();
  const { open } = useAppKit();
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
      {address ? (
        <div className="flex items-center gap-2">
          {/* <Link href="/my-projects">
            <Button variant={"ghost"}>My Projects</Button>
          </Link> */}
          <Button variant={"outline"} size={"icon"} onClick={() => open()}>
            <User2 />
          </Button>
        </div>
      ) : (
        <WalletButton />
      )}
    </div>
  );
};

export default Header;
