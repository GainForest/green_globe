import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React from "react";
import Link from "next/link";

const Header = () => {
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
      <Link href="/">
        <Button variant={"outline"} size={"icon"}>
          <Home />
        </Button>
      </Link>
    </div>
  );
};

export default Header;
