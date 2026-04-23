"use client";
import React from "react";
import { blo } from "blo";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";
const EthAvatar = ({
  address,
  className,
  ...props
}: { address: `0x${string}` } & Omit<ImageProps, "alt" | "src">) => {
  return (
    <Image
      {...props}
      src={blo(address)}
      className={cn("rounded-full", className)}
      height={24}
      width={24}
      alt={`${address} avatar`}
    />
  );
};

export default EthAvatar;
