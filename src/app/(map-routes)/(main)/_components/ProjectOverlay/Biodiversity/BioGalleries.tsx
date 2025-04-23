import { Button } from "@/components/ui/button";
import { ChevronLeft, LucideProps } from "lucide-react";
import React from "react";
import useBiodiversityPredictionsStore from "./Predictions/store";
import { motion } from "framer-motion";

const BioGalleries = ({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: React.FC<LucideProps>;
  children: React.ReactNode;
}) => {
  const { setPage } = useBiodiversityPredictionsStore();
  return (
    <motion.div
      className="flex flex-col"
      initial={{ opacity: 0, x: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: 20, filter: "blur(10px)" }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="secondary"
          size={"icon"}
          className="rounded-full"
          onClick={() => setPage(null)}
        >
          <ChevronLeft size={16} />
        </Button>
        <h1 className="text-xl font-bold flex items-center justify-start gap-2">
          <Icon size={20} />
          <span>{title}</span>
        </h1>
      </div>
      {children}
    </motion.div>
  );
};

export default BioGalleries;
