"use client";
import Image from "next/image";
import useProjectOverlayStore from "./store";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";

type SplashProps = {
  imageURL: string | null;
  projectDetails: AppGainforestOrganizationInfo.Record;
};

const Splash = ({ imageURL, projectDetails }: SplashProps) => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  if (activeTab === "ask-ai") return null;

  return (
    <>
      {imageURL ?
        <div>
          <Image
            src={imageURL}
            alt={projectDetails.displayName}
            width={300}
            height={300}
            className="w-full h-[200px] object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
          />
        </div>
      : "No splash image found"}
    </>
  );
};

export default Splash;
