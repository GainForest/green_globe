import React, { useState } from "react";
import { motion } from "framer-motion";
import { Hypercert } from "@/graphql/hypercerts/types";
import { EcocertItem } from "./EcocertItem";
import { Input } from "@/components/ui/input";
import { CircleAlert, Search } from "lucide-react";
import Link from "next/link";

const EcocertsList = ({
  userEcocerts,
  handleEcocertSelect,
}: {
  userEcocerts: Hypercert[];
  handleEcocertSelect: (ecocertId: string) => void;
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEcocerts = userEcocerts.filter((ecocert) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
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
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-bold text-lg">Select an ecocert</h1>
        <p className="text-muted-foreground text-sm">
          Choose an ecocert and click Link Ecocert button to continue.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ecocerts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 bg-background"
        />
      </div>

      <ul className="flex flex-col gap-2">
        {filteredEcocerts.map((ecocert, index) => (
          <EcocertItem
            key={ecocert.hypercertId || ""}
            ecocert={ecocert}
            setEcocert={handleEcocertSelect}
            index={index}
          />
        ))}
        {filteredEcocerts.length === 0 ? (
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
        ) : (
          <div className="text-center text-balance text-muted-foreground text-sm my-2">
            Do not have an ecocert for this project?
            <br />
            Create one now at{" "}
            <Link
              href={"https://ecocertain.xyz/submit"}
              target="_blank"
              className="underline"
            >
              <b>Ecocertain</b>
            </Link>
            .{" "}
          </div>
        )}
      </ul>
    </motion.div>
  );
};

export default EcocertsList;
