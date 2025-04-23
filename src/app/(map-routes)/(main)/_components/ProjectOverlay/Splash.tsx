"use client";
import Image from "next/image";
import { Project } from "./store/types";
import useProjectOverlayStore from "./store";

type SplashProps = {
  imageURL: string | null;
  projectDetails: Project;
};

const Splash = ({ imageURL, projectDetails }: SplashProps) => {
  const activeTab = useProjectOverlayStore((state) => state.activeTab);
  if (activeTab === "ask-ai") return null;

  return (
    <>
      {imageURL ? (
        <div>
          <Image
            src={imageURL}
            alt={projectDetails.name}
            width={300}
            height={300}
            className="w-full h-[200px] object-cover object-center [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
          />
        </div>
      ) : (
        "No splash image found"
      )}
    </>
  );
};

export default Splash;
