"use client";

import React from "react";
import Image from "next/image";

const Header = ({ showBrandName = true }: { showBrandName?: boolean }) => {
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
      {/* Auth controls removed; no-op header for now */}
      <div />
    </div>
  );
};

export default Header;
