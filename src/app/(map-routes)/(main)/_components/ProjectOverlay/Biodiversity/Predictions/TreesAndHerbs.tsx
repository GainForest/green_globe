import React, { useState } from "react";
import { BiodiversityPlant, BiodiversityTraits } from "./store/types";
import GalleryWidget from "@/components/GalleryWidget";
import { camelCaseToTitleCase } from "@/lib/utils";

const ContentBox = ({
  title,
  content,
}: {
  title: React.ReactNode;
  content: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col justify-between bg-foreground/5 rounded-lg p-2">
      <h2 className="text-sm text-muted-foreground text-balance">{title}</h2>
      <div className="font-bold text-lg">{content}</div>
    </div>
  );
};

const ImageInfoContent = ({ tree }: { tree: BiodiversityPlant }) => {
  const traits = tree.traits ?? null;
  const edibleParts = tree.edibleParts ?? null;
  const isInvasive = tree.group === "INVASIVE";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-1">
        <h1 className="font-bold text-2xl text-balance w-[calc(100%-40px)]">
          {tree.scientificName}
        </h1>
        {isInvasive && (
          <span className="inline-flex text-sm bg-destructive text-destructive-foreground rounded-full px-2 py-1">
            Invasive Species
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {traits &&
          Object.keys(traits).map((traitKey) => (
            <ContentBox
              key={traitKey}
              title={camelCaseToTitleCase(traitKey)}
              content={traits[traitKey as keyof BiodiversityTraits]}
            />
          ))}
        {edibleParts && edibleParts.length > 0 && (
          <div className="col-span-2">
            <ContentBox title="Edible Parts" content={edibleParts.join(", ")} />
          </div>
        )}
      </div>
    </div>
  );
};

const TreesAndHerbs = ({
  data,
  type,
}: {
  data: BiodiversityPlant[];
  type: "Trees" | "Herbs";
}) => {
  const nativeData: BiodiversityPlant[] = [];
  const invasiveData: BiodiversityPlant[] = [];
  data.forEach((tree) => {
    if (tree.group === "INVASIVE") {
      invasiveData.push(tree);
    } else {
      nativeData.push(tree);
    }
  });

  const [currentNativeDataIndex, setCurrentNativeDataIndex] =
    useState<number>(0);
  const [currentInvasiveDataIndex, setCurrentInvasiveDataIndex] =
    useState<number>(0);

  return (
    <div className="flex flex-col gap-4 py-2">
      {nativeData.length > 0 && (
        <GalleryWidget
          title={`Predicted Native ${type}`}
          subtitle={
            <>
              Total Native {type} Predicted: <b>{nativeData.length}</b>
            </>
          }
          images={nativeData.map((tree) => ({
            id: tree.key,
            src:
              tree.awsUrl ?? `/assets/placeholders/${type.toLowerCase()}.png`,
            alt: tree.scientificName,
          }))}
          currentDialogImageIndex={currentNativeDataIndex}
          onDialogImageChange={({ imageIndex }) =>
            setCurrentNativeDataIndex(imageIndex)
          }
          imageInfoContent={
            <ImageInfoContent tree={nativeData[currentNativeDataIndex]} />
          }
        />
      )}
      {invasiveData.length > 0 && (
        <GalleryWidget
          title={`Predicted Invasive ${type}`}
          subtitle={
            <>
              Total Invasive {type} Predicted: <b>{invasiveData.length}</b>
            </>
          }
          images={invasiveData.map((tree) => ({
            id: tree.key,
            src:
              tree.awsUrl ?? `/assets/placeholders/${type.toLowerCase()}.png`,
            alt: tree.scientificName,
          }))}
          currentDialogImageIndex={currentInvasiveDataIndex}
          onDialogImageChange={({ imageIndex }) =>
            setCurrentInvasiveDataIndex(imageIndex)
          }
          imageInfoContent={
            <ImageInfoContent tree={invasiveData[currentInvasiveDataIndex]} />
          }
        />
      )}
    </div>
  );
};

export default TreesAndHerbs;
