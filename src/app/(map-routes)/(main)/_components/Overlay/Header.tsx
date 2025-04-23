"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useAppKitAccount } from "@reown/appkit/react";

const WalletButton = dynamic(() => import("@/app/_components/WalletButton"), {
  ssr: false,
});

const Header = () => {
  const { address } = useAppKitAccount();
  // const { open } = useAppKit();
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
        <span className="font-bold text-lg">GainForest</span>
      </div>

      {/* Commenting this code to temporarily remove it */}
      {address ? null : (
        // <div className="flex items-center gap-2">
        //   <Link href="/my-projects">
        //     <Button variant={"ghost"}>My Projects</Button>
        //   </Link>
        //   <Button variant={"outline"} size={"icon"} onClick={() => open()}>
        //     <User2 />
        //   </Button>
        // </div>
        <WalletButton />
      )}
    </div>
  );
};

export default Header;
