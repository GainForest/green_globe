import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarRange, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Hypercert } from "@/graphql/hypercerts/types";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ProjectEcocert } from "./types";
import { AsyncData } from "@/lib/types";
import { fetchHypercertById } from "@/graphql/hypercerts/queries/hypercert-by-id";
import { useQuery } from "@tanstack/react-query";
import EcocertSkeleton from "./EcocertSkeleton";

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const EcocertItem = ({
  projectEcocert,
  updateProjectEcocert,
  index,
}: {
  projectEcocert: ProjectEcocert;
  updateProjectEcocert: (asyncEcocert: AsyncData<Hypercert>) => void;
  index: number;
}) => {
  const {
    data: ecocert,
    isLoading: isEcocertLoading,
    error: ecocertFetchError,
  } = useQuery({
    queryKey: ["project-ecocert", projectEcocert.ecocertId],
    queryFn: async (): Promise<Hypercert> => {
      const hypercert = await fetchHypercertById(projectEcocert.ecocertId);
      if (hypercert === null) throw new Error("Unable to fetch ecocert.");
      return hypercert;
    },
  });

  useEffect(() => {
    if (isEcocertLoading) {
      updateProjectEcocert({
        _status: "loading",
        data: null,
      });
    } else if (ecocertFetchError) {
      updateProjectEcocert({
        _status: "error",
        data: null,
      });
    } else if (ecocert) {
      updateProjectEcocert({
        _status: "success",
        data: ecocert,
      });
    }
  }, [ecocert, isEcocertLoading, ecocertFetchError]);

  const [imageLoading, setImageLoading] = useState(true);

  if (isEcocertLoading) {
    return <EcocertSkeleton index={index} />;
  }

  if (ecocertFetchError || !ecocert) return null;

  const { hypercertId, metadata } = ecocert;
  const { name, description, work } = metadata ?? {};

  return (
    <motion.li
      className="flex items-start gap-4 border border-border rounded-lg p-4 bg-background/50"
      initial={{
        opacity: 0,
        filter: "blur(10px)",
        y: 20,
        x: 0,
      }}
      animate={{ opacity: 1, filter: "blur(0px)", y: 0, x: 0 }}
      exit={{ opacity: 0, filter: "blur(10px)", y: 0, x: -20 }}
      transition={{
        duration: 0.15,
        delay: index * 0.15,
      }}
    >
      <div className="w-[80px] h-[100px] relative rounded-md border border-border overflow-hidden">
        <Image
          src={`https://ecocertain.xyz/api/hypercert-image/${hypercertId}`}
          alt={metadata?.name || "Ecocert thumbnail"}
          className="object-cover object-top h-full w-full"
          height={200}
          width={100}
          onLoadingComplete={() => setImageLoading(false)}
        />
        {imageLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div>
          <div className="flex items-start w-full">
            <div className="font-bold text-base line-clamp-2 flex-1">
              {name}
            </div>
          </div>

          <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </div>

          {work && (
            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
              <CalendarRange size={12} className="flex-shrink-0" />
              <span className="font-bold">
                {formatDate(Number(work.from))} - {formatDate(Number(work.to))}
              </span>
            </div>
          )}

          <div className="w-full flex items-center justify-end gap-1 mt-2">
            <Link
              href={`https://ecocertain.xyz/hypercert/${hypercertId}`}
              target="_blank"
            >
              <Button variant="secondary" size={"sm"} className="rounded-full">
                View Ecocert
                <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.li>
  );
};
