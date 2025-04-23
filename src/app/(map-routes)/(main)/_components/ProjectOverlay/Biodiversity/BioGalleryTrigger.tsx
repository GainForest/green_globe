import { ChevronRight } from "lucide-react";
import Image from "next/image";
import React from "react";

const BioGalleryTrigger = ({
  title,
  description,
  count,
  imageSrc,
  onClick,
}: {
  title: string;
  description: string;
  count: number;
  imageSrc: string;
  onClick: () => void;
}) => {
  return (
    <button
      className="relative bg-background rounded-xl flex flex-col items-center overflow-hidden group"
      onClick={onClick}
    >
      <Image
        src={imageSrc}
        alt={title}
        width={640}
        height={480}
        className="w-full h-28 object-cover object-center brightness-90 scale-105 group-hover:scale-100 transition-all duration-300"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-b from-transparent via-background/70 to-background flex flex-col items-start">
        <h2
          className="font-bold text-xl"
          style={{
            textShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
          }}
        >
          {title}
        </h2>
        <span className="text-sm">{description}</span>
      </div>
      <div className="absolute top-2 right-2 rounded-full px-3 py-1 text-sm flex items-center justify-center bg-neutral-500/70 backdrop-blur-md text-white shadow-sm">
        {count}
        <ChevronRight size={16} />
      </div>
    </button>
  );
};

export default BioGalleryTrigger;
