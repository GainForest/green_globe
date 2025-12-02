"use client";
import Image from "next/image";
import useProjectOverlayStore from "./store";
import { AppGainforestOrganizationInfo } from "climateai-sdk/lex-api";
import { getBlobUrl } from "climateai-sdk/utilities";
import type { SupportedPDSDomain } from "climateai-sdk";

const CoverImage = ({
  organization,
  did,
  pdsDomain,
}: {
  organization: AppGainforestOrganizationInfo.Record;
  did: string;
  pdsDomain: SupportedPDSDomain;
}) => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  if (activeTab === "ask-ai") return null;

  const imageURL =
    organization.coverImage ?
      getBlobUrl(did, organization.coverImage, pdsDomain)
    : null;

  return (
    <div>
      <Image
        src={imageURL ?? "/assets/placeholders/cover-image.png"}
        alt={organization.displayName}
        width={300}
        height={300}
        className="w-full h-[200px] object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
      />
    </div>
  );
};

export default CoverImage;
