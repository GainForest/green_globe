"use client";
import React, { useState, useMemo } from "react";
import useProjectOverlayStore from "../../../store";
import ErrorMessage from "../../../ErrorMessage";
import { Combobox } from "@/components/ui/combobox";
import { NormalizedTreeProperties } from "../../../store/types";
import ExportDialog from "./ExportDialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import LoadingSkeleton from "./loading";

const NoDataMessage = () => {
  return <ErrorMessage message="No measured trees found for this project." />;
};

const ProgressBar = ({
  progress,
  innerClassName,
  className,
}: {
  progress: number;
  innerClassName: string;
  className: string;
}) => {
  return (
    <div
      className={cn(
        "w-full bg-muted rounded-full h-2.5 overflow-hidden",
        className
      )}
    >
      <motion.div
        className={cn("h-full rounded-full", innerClassName)}
        initial={{ width: `0%` }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3 }}
      ></motion.div>
    </div>
  );
};

const DataItem = ({
  label,
  count,
  progress,
  progressClassName,
}: {
  label: string;
  count: number;
  progress: number;
  progressClassName: string;
}) => {
  return (
    <div key={label} className="bg-card p-4">
      <div className="flex justify-between items-center">
        <span className="font-medium text-card-foreground">{label}</span>
        <span className="bg-accent text-accent-foreground px-2 py-1 rounded-full text-sm">
          {count} {count === 1 ? "tree" : "trees"}
        </span>
      </div>
      <ProgressBar
        progress={progress}
        innerClassName={progressClassName}
        className="mt-2"
      />
    </div>
  );
};

// Define filter options
const filterOptions = [
  { value: "species", label: "Species" },
  { value: "height", label: "Height" },
];

// Define height ranges
const heightRanges = [
  { min: 0, max: 10, label: "<10m" },
  { min: 10, max: 20, label: "10-20m" },
  { min: 20, max: 30, label: "20-30m" },
  { min: 30, max: 40, label: "30-40m" },
  { min: 40, max: 50, label: "40-50m" },
  { min: 50, max: Infinity, label: ">50m" },
];

const MeasuredTrees = () => {
  const projectId = useProjectOverlayStore((state) => state.projectId);
  const treesAsync = useProjectOverlayStore((state) => state.treesAsync);
  const { _status, data } = treesAsync ?? { _status: "loading", data: null };
  const [selectedFilter, setSelectedFilter] = useState("species");

  const projectTrees: NormalizedTreeProperties[] =
    data?.features.map((feature) => feature.properties) ?? [];

  // Group trees by species
  const speciesGroups = useMemo(() => {
    const groups: Record<string, NormalizedTreeProperties[]> = {};
    projectTrees.forEach((tree) => {
      const species = tree.species || "Unknown";
      if (!groups[species]) {
        groups[species] = [];
      }
      groups[species].push(tree);
    });
    return Object.entries(groups)
      .map(([species, trees]) => ({ species, count: trees.length }))
      .sort((a, b) => b.count - a.count);
  }, [projectTrees]);

  // Group trees by height
  const heightGroups = useMemo(() => {
    const groups = heightRanges.map((range) => ({
      ...range,
      count: 0,
      trees: [] as NormalizedTreeProperties[],
    }));

    projectTrees.forEach((tree) => {
      const height = parseFloat(tree.height || tree.Height || "0");
      const rangeIndex = heightRanges.findIndex(
        (range) => height >= range.min && height < range.max
      );
      if (rangeIndex !== -1) {
        groups[rangeIndex].count++;
        groups[rangeIndex].trees.push(tree);
      }
    });

    return groups.filter((group) => group.count > 0);
  }, [projectTrees]);

  if (
    projectId ===
    "4d4508e1473cdc66db75dcb18732981c0ebc1f33e87dbfad01129bfe0072f19e"
  ) {
    return <NoDataMessage />;
  }
  if (treesAsync === null) {
    return <LoadingSkeleton />;
  }

  if (_status === "loading") {
    return <LoadingSkeleton />;
  }
  if (_status === "error") {
    return <ErrorMessage />;
  }

  if (data === null || data.features.length === 0) {
    return <NoDataMessage />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold">Filter by:</span>
          <Combobox
            options={filterOptions}
            value={selectedFilter}
            onChange={(val) => {
              setSelectedFilter(val);
            }}
            className="max-w-[300px]"
          />
        </div>

        <ExportDialog
          selectedFilter={selectedFilter}
          projectTrees={projectTrees}
          speciesGroups={speciesGroups}
          heightGroups={heightGroups}
        />
      </div>

      <div className="mt-4">
        {selectedFilter === "species" ? (
          <div className="grid rounded-lg border border-border divide-y overflow-hidden">
            {speciesGroups.map((group) => (
              <DataItem
                key={group.species}
                label={group.species}
                count={group.count}
                progress={(group.count / projectTrees.length) * 100}
                progressClassName="bg-chart-1"
              />
            ))}
          </div>
        ) : (
          <div className="grid rounded-lg border border-border divide-y overflow-hidden">
            {heightGroups.map((group) => (
              <DataItem
                key={group.label}
                label={group.label}
                count={group.count}
                progress={(group.count / projectTrees.length) * 100}
                progressClassName="bg-chart-2"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasuredTrees;
