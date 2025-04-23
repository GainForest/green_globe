import React, { useState } from "react";
import { BiodiversityAnimal } from "./store/types";
import GalleryWidget from "@/components/GalleryWidget";
import { groupBy, toKebabCase } from "@/lib/utils";
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

const ImageInfoContent = ({ animal }: { animal: BiodiversityAnimal }) => {
  const { Species, Type } = animal;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-start gap-1">
        <h1 className="font-bold text-2xl text-balance w-[calc(100%-40px)]">
          {Species}
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <ContentBox title="Type" content={Type} />
        </div>
      </div>
    </div>
  );
};

const Animals = ({ data }: { data: BiodiversityAnimal[] }) => {
  const groupedData = groupBy(data, "Type") as Array<
    Partial<{
      [key in BiodiversityAnimal["Type"]]: BiodiversityAnimal[];
    }>
  >;

  const defaultItemIndicesByGroup = new Array<number>(groupedData.length).fill(
    0
  );
  const [currentItemIndicesByGroup, setCurrentItemIndicesByGroup] = useState(
    defaultItemIndicesByGroup
  );

  return (
    <div className="flex flex-col gap-4 py-2">
      {groupedData.map((group, index) => {
        const groupKey = Object.keys(group)[0] as keyof typeof group;
        const data = group[groupKey];
        if (!data) return null;

        return (
          <GalleryWidget
            key={`${groupKey}-${index}`}
            title={`Predicted ${groupKey}s`}
            subtitle={
              <>
                Total {groupKey}s Predicted: <b>{data.length}</b>
              </>
            }
            images={data.map((animal, index) => ({
              id: animal.Species + index,
              src: `/assets/placeholders/${toKebabCase(animal.Type)}.png`,
              alt: animal.Species,
            }))}
            currentDialogImageIndex={currentItemIndicesByGroup[index] ?? 0}
            onDialogImageChange={({ imageIndex }) =>
              setCurrentItemIndicesByGroup((prev) => {
                const newArray = [...prev];
                newArray[index] = imageIndex;
                return newArray;
              })
            }
            imageInfoContent={
              <ImageInfoContent
                animal={data[currentItemIndicesByGroup[index] ?? 0]}
              />
            }
          />
        );
      })}
    </div>
  );
};

export default Animals;
