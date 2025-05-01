import React from "react";
import { motion } from "framer-motion";

const EcocertSkeleton = ({ index }: { index: number }) => {
  return (
    <motion.div
      key={index}
      initial={{
        opacity: 0,
        filter: "blur(10px)",
        scale: 1.2,
        y: 20,
      }}
      animate={{
        opacity: 1,
        filter: "blur(0px)",
        scale: 1,
        y: 0,
      }}
      transition={{ delay: index, duration: 0.75 }}
      className="bg-background/20 flex items-start p-4 gap-2 rounded-xl border border-border/20"
    >
      <div className="bg-muted w-14 h-20 rounded-md animate-pulse"></div>
      <div className="flex flex-col gap-2 flex-1">
        <div className="bg-muted w-[33%] h-8 rounded-md animate-pulse"></div>
        <div className="bg-muted w-[100%] h-5 rounded-md animate-pulse delay-300"></div>
        <div className="bg-muted w-[50%] h-5 rounded-md animate-pulse delay-700"></div>
      </div>
    </motion.div>
  );
};

export default EcocertSkeleton;
