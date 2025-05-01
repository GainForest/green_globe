import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Hypercert } from "@/graphql/hypercerts/types";
import { EcocertItem } from "./EcocertItem";
import { Input } from "@/components/ui/input";
import { CircleAlert, Search } from "lucide-react";
import { EcocertAttestation } from "@/graphql/eas/types";
import { AsyncData } from "@/lib/types";
import { ProjectEcocert } from "./types";
import LinkEcocertButton from "./LinkEcocertButton";

const EcocertsList = ({
  ecocertAttestations,
  onLinkEcocertButtonClick,
}: {
  ecocertAttestations: EcocertAttestation[];
  onLinkEcocertButtonClick: () => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [projectEcocerts, setProjectEcocerts] = useState<ProjectEcocert[]>(
    ecocertAttestations.map((obj) => ({
      ...obj,
      asyncEcocert: { _status: "loading", data: null },
    }))
  );

  const updateProjectEcocertByIndex = useCallback(
    (index: number, asyncEcocert: AsyncData<Hypercert>) => {
      if (index < 0 || index >= projectEcocerts.length) return;
      setProjectEcocerts([
        ...projectEcocerts.slice(0, index),
        { ...projectEcocerts[index], asyncEcocert },
        ...projectEcocerts.slice(index + 1),
      ]);
    },
    [projectEcocerts]
  );

  const filteredProjectEcocerts = projectEcocerts.filter((projectEcocert) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const { asyncEcocert } = projectEcocert;
    if (asyncEcocert._status !== "success") return false;
    const { data: ecocert } = asyncEcocert;
    const metadata = ecocert.metadata;

    // Search in hypercertId
    if (ecocert.hypercertId.toLowerCase().includes(query)) return true;

    // Search in metadata if available
    if (metadata) {
      // Search in name
      if (metadata.name.toLowerCase().includes(query)) return true;

      // Search in description
      if (metadata.description.toLowerCase().includes(query)) return true;

      // Search in work scope
      if (
        metadata.work?.scope.some((scope) =>
          scope.toLowerCase().includes(query)
        )
      )
        return true;

      // Search in work dates
      if (
        metadata.work?.from &&
        new Date(parseInt(metadata.work.from) * 1000)
          .toLocaleDateString()
          .toLowerCase()
          .includes(query)
      )
        return true;

      if (
        metadata.work?.to &&
        new Date(parseInt(metadata.work.to) * 1000)
          .toLocaleDateString()
          .toLowerCase()
          .includes(query)
      )
        return true;
    }

    return false;
  });

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={{ opacity: 1, filter: "blur(0px" }}
    >
      <div className="w-full flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search linked ecocerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-background"
          />
        </div>
        <LinkEcocertButton onClick={onLinkEcocertButtonClick} />
      </div>

      <ul className="flex flex-col gap-2">
        {filteredProjectEcocerts.map((projectEcocert, index) => (
          <EcocertItem
            key={projectEcocert.ecocertId}
            projectEcocert={projectEcocert}
            updateProjectEcocert={(asyncEcocert: AsyncData<Hypercert>) =>
              updateProjectEcocertByIndex(index, asyncEcocert)
            }
            index={index}
          />
        ))}
        {filteredProjectEcocerts.length === 0 && (
          <div className="p-4 text-center text-balance">
            <div className="flex items-center justify-center mb-1">
              <CircleAlert className="opacity-50" size={32} />
            </div>
            <span className="text-foreground font-bold text-lg">
              No results
            </span>
            <br />
            <span className="text-sm text-muted-foreground">
              No ecocerts could be found for that search query. Please try
              searching again with different query.
            </span>
          </div>
        )}
      </ul>
    </motion.div>
  );
};

export default EcocertsList;
