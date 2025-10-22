"use client";
import Image from "next/image";
import useProjectOverlayStore from "./store";
import { AppGainforestOrganizationInfo } from "@/../lexicon-api";

type CoverImageProps = {
  imageURL: string;
  projectDetails: AppGainforestOrganizationInfo.Record;
};

const CoverImage = ({ imageURL, projectDetails }: CoverImageProps) => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  if (activeTab === "ask-ai") return null;

  return (
    <div>
      <Image
        src={imageURL}
        alt={projectDetails.displayName}
        width={300}
        height={300}
        className="w-full h-[200px] object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
      />
    </div>
  );
};

export default CoverImage;
