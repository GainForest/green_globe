"use client";
import React, { useState, useMemo } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SlidingTabs, Underlay, Tab } from "@/components/ui/sliding-tabs";
import useProjectOverlayStore from "../../../store";
import { NormalizedTreeProperties } from "@/app/(map-routes)/(main)/_components/ProjectOverlay/store/types";

interface ExportDialogProps {
  selectedFilter: string;
  projectTrees: NormalizedTreeProperties[];
  speciesGroups: { species: string; count: number }[];
  heightGroups: { label: string; count: number; min: number; max: number }[];
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  selectedFilter,
  projectTrees,
  speciesGroups,
  heightGroups,
}) => {
  const projectData = useProjectOverlayStore((state) => state.projectData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportTab, setExportTab] = useState("complete");

  // Generate preview data based on selected export type
  const previewData = useMemo(() => {
    if (exportTab === "complete") {
      if (projectTrees.length === 0) return { headers: [], rows: [] };

      // Get all unique keys from all objects
      const allKeys = new Set<string>();
      projectTrees.slice(0, 10).forEach((tree) => {
        Object.keys(tree).forEach((key) => allKeys.add(key));
      });

      // Create header row
      const headers = Array.from(allKeys);

      // Create preview rows (max 4)
      const rows = projectTrees.slice(0, 4).map((tree) => {
        return headers.map((header) => {
          const treeHeader = tree[header as keyof NormalizedTreeProperties];
          const value = treeHeader ?? "";
          return String(value);
        });
      });

      return { headers, rows };
    } else {
      if (selectedFilter === "species") {
        const headers = ["Species", "Count"];
        const rows = speciesGroups
          .slice(0, 4)
          .map((group) => [group.species, String(group.count)]);
        return { headers, rows };
      } else {
        const headers = ["Height Range", "Count"];
        const rows = heightGroups
          .slice(0, 4)
          .map((group) => [group.label, String(group.count)]);
        return { headers, rows };
      }
    }
  }, [exportTab, selectedFilter, projectTrees, speciesGroups, heightGroups]);

  const handleExport = () => {
    let csvContent = "";
    let filename = `tree-data-${projectData?.name ?? "untitled"}.csv`;

    if (exportTab === "complete") {
      // Export all tree data
      if (projectTrees.length > 0) {
        // Get all unique keys from all objects
        const allKeys = new Set<string>();
        projectTrees.forEach((tree) => {
          Object.keys(tree).forEach((key) => allKeys.add(key));
        });

        // Create header row
        const headers = Array.from(allKeys);
        csvContent = headers.join(",") + "\n";

        // Add data rows
        projectTrees.forEach((tree) => {
          const row = headers.map((header) => {
            const treeHeader = tree[header as keyof NormalizedTreeProperties];
            const value = treeHeader ?? "";
            // Escape commas and quotes
            return typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
              ? `"${value.replace(/"/g, '""')}"`
              : value;
          });
          csvContent += row.join(",") + "\n";
        });
      }
      filename = "complete-tree-data.csv";
    } else {
      // Export filtered data
      filename = `${selectedFilter}-distribution-${
        projectData?.name ?? "untitled"
      }.csv`;
      if (selectedFilter === "species") {
        // Export species data
        csvContent = "Species,Count\n";
        speciesGroups.forEach((group) => {
          csvContent += `"${group.species}",${group.count}\n`;
        });
      } else {
        // Export height data
        csvContent = "Height Range,Count\n";
        heightGroups.forEach((group) => {
          csvContent += `"${group.label}",${group.count}\n`;
        });
      }
    }

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDialogOpen(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Tree Data</DialogTitle>
          <DialogDescription>
            Export the tree data for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SlidingTabs
            activeKey={exportTab}
            onTabChange={(key) => setExportTab(key)}
            className="mb-4"
          >
            <Underlay />
            <Tab tabKey="complete" asChild>
              <Button
                variant="ghost"
                className="flex-1 relative z-10 disabled:opacity-100"
                disabled={exportTab === "complete"}
                onClick={() => setExportTab("complete")}
              >
                Complete Data
              </Button>
            </Tab>
            <Tab tabKey="filtered" asChild>
              <Button
                variant="ghost"
                className="flex-1 relative z-10 disabled:opacity-100"
                disabled={exportTab === "filtered"}
                onClick={() => setExportTab("filtered")}
              >
                Filtered Data
              </Button>
            </Tab>
          </SlidingTabs>

          <div className="mt-6">
            {exportTab === "complete" ? (
              <p className="text-sm text-muted-foreground">
                Export all tree data from this project, including all species
                and measurements.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Export tree data grouped by {selectedFilter}, as shown in the
                current view.
              </p>
            )}
          </div>

          {/* Preview Table */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="border rounded-md overflow-x-scroll w-0 min-w-full [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]">
              <div className="flex items-start">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      {previewData.headers.map((header, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {previewData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-3 py-2 text-sm whitespace-nowrap text-card-foreground"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewData.rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={previewData.headers.length || 1}
                          className="px-3 py-4 text-sm text-center text-muted-foreground"
                        >
                          No data to preview
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {projectTrees.length > 4 && exportTab === "complete" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {projectTrees.length - 4} more rows not shown in preview
                </p>
              )}
              {selectedFilter === "species" &&
                speciesGroups.length > 4 &&
                exportTab === "filtered" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {speciesGroups.length - 4} more species not shown in preview
                  </p>
                )}
              {selectedFilter === "height" &&
                heightGroups.length > 4 &&
                exportTab === "filtered" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {heightGroups.length - 4} more height ranges not shown in
                    preview
                  </p>
                )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>Download</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
