import { CircleAlert, Info, PawPrint, TreesIcon } from "lucide-react";
import React, { useEffect, useMemo } from "react";
import useBiodiversityPredictionsStore from "./store";
import TreesAndHerbs from "./TreesAndHerbs";
import BioGalleries from "../BioGalleries";
import BioGalleryTrigger from "../BioGalleryTrigger";
import { AnimatePresence, motion } from "framer-motion";
import Animals from "./Animals";
import useProjectOverlayStore from "../../store";
import ErrorMessage from "../../ErrorMessage";

const Predictions = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const { data, dataStatus, fetchData, page, setPage } =
    useBiodiversityPredictionsStore();

  useEffect(() => {
    fetchData();
  }, [projectId, fetchData]);

  // If some data for a page is missing, set the page to null
  useEffect(() => {
    if (page === null) return;
    if (data === null) {
      setPage(null);
      return;
    }
    const { treesData, herbsData, animalsData } = data;
    if (page === "plants" && treesData.length === 0 && herbsData.length === 0) {
      setPage(null);
      return;
    }
    if (page === "animals" && animalsData.length === 0) {
      setPage(null);
      return;
    }
  }, [page, data, dataStatus]);

  const hasNoDataInAnyCategory = useMemo(() => {
    if (data === null) return true;
    const { treesData, herbsData, animalsData } = data;
    return (
      treesData.length === 0 &&
      herbsData.length === 0 &&
      animalsData.length === 0
    );
  }, [data]);

  if (dataStatus === "loading") {
    return (
      <div className="flex flex-col gap-2">
        <div className="w-full h-32 rounded-xl bg-foreground/10 animate-pulse"></div>
        <div className="w-full h-32 rounded-xl bg-foreground/10 animate-pulse delay-500"></div>
      </div>
    );
  }
  if (dataStatus === "error" || !data) {
    return <ErrorMessage />;
  }

  return (
    <article className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {page === null ? (
          <motion.div
            className="flex flex-col gap-2"
            initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.3 }}
            key={"predictions-null"}
          >
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <Info className="shrink-0" size={16} />
              <span>
                Species that have been predicted for this site using species
                distribution models.
              </span>
            </div>
            {hasNoDataInAnyCategory ? (
              <div className="flex flex-col items-center justify-center w-full p-4 gap-2 bg-muted rounded-xl">
                <CircleAlert size={36} className="text-muted-foreground/50" />
                <span className="text-muted-foreground text-sm">
                  No biodiversity data found for this site.
                </span>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.treesData.length + data.herbsData.length > 0 && (
                  <BioGalleryTrigger
                    title={"Plants"}
                    description="View all plant predictions"
                    imageSrc={"/assets/plants.jpg"}
                    onClick={() => {
                      setPage("plants");
                    }}
                    count={data.treesData.length + data.herbsData.length}
                  />
                )}
                {data.animalsData.length > 0 && (
                  <BioGalleryTrigger
                    title={"Animals"}
                    description="View all animal predictions"
                    imageSrc={"/assets/animals.jpg"}
                    onClick={() => {
                      setPage("animals");
                    }}
                    count={data.animalsData.length}
                  />
                )}
              </ul>
            )}
          </motion.div>
        ) : page === "plants" ? (
          <BioGalleries
            title={"Plants"}
            Icon={TreesIcon}
            key={"predictions-plants"}
          >
            <TreesAndHerbs data={data.treesData} type="Trees" />
            <TreesAndHerbs data={data.herbsData} type="Herbs" />
          </BioGalleries>
        ) : (
          <BioGalleries
            title={"Animals"}
            Icon={PawPrint}
            key={"predictions-animals"}
          >
            <Animals data={data.animalsData} />
          </BioGalleries>
        )}
      </AnimatePresence>
      {page !== null && (
        <div className="text-muted-foreground text-sm flex items-center justify-center text-center gap-2">
          <Info className="shrink-0" size={16} />
          <span>API provided by Restor</span>
        </div>
      )}
    </article>
  );
};

export default Predictions;
