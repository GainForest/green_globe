"use client";

import React, { useCallback, useEffect, useState } from "react";
import usePreviewStore from "../../_features/preview/store";
import useHoveredTreeOverlayStore from "../HoveredTreeOverlay/store";
import useProjectOverlayStore from "../ProjectOverlay/store";
import type { NormalizedTreeFeature } from "../ProjectOverlay/store/types";
import useMapStore from "./store";
import { getTreeInformationFromFeature } from "./utils";

type ScreenPoint = {
  x: number;
  y: number;
};

type ProjectedTree = ScreenPoint & {
  feature: NormalizedTreeFeature;
};

type TreeOverlayItem =
  | {
      kind: "tree";
      id: string;
      x: number;
      y: number;
      selected: boolean;
      feature: NormalizedTreeFeature;
    }
  | {
      kind: "cluster";
      id: string;
      x: number;
      y: number;
      count: number;
      radius: number;
    };

const CLUSTER_CELL_SIZE_PX = 50;
const MIN_CLUSTER_COUNT = 4;
const VIEWPORT_PADDING_PX = 96;
const TREE_DOT_RADIUS_PX = 4;
const SELECTED_TREE_DOT_RADIUS_PX = 10;
const CLOSE_VIEW_INDIVIDUAL_TREE_ALTITUDE = 0.0025;
const MAX_TREE_OVERLAY_ALTITUDE = 0.05;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isPointTreeFeature = (
  feature: NormalizedTreeFeature,
): feature is NormalizedTreeFeature & {
  geometry: { type: "Point"; coordinates: [number, number] };
} =>
  feature.geometry?.type === "Point" &&
  isFiniteNumber(feature.geometry.coordinates[0]) &&
  isFiniteNumber(feature.geometry.coordinates[1]);

const getClusterRadius = (count: number): number =>
  Math.max(19, Math.min(48, 12 + Math.sqrt(count) * 2.5));

const getClusterKey = (point: ScreenPoint): string =>
  `${Math.floor(point.x / CLUSTER_CELL_SIZE_PX)}:${Math.floor(
    point.y / CLUSTER_CELL_SIZE_PX,
  )}`;

const isWithinViewport = (
  point: ScreenPoint,
  width: number,
  height: number,
): boolean =>
  point.x >= -VIEWPORT_PADDING_PX &&
  point.x <= width + VIEWPORT_PADDING_PX &&
  point.y >= -VIEWPORT_PADDING_PX &&
  point.y <= height + VIEWPORT_PADDING_PX;

const projectTrees = (
  features: NormalizedTreeFeature[],
  getScreenCoords: (lng: number, lat: number) => ScreenPoint,
): ProjectedTree[] =>
  features.flatMap((feature) => {
    if (!isPointTreeFeature(feature)) return [];

    const [lng, lat] = feature.geometry.coordinates;
    const point = getScreenCoords(lng, lat);
    if (!isFiniteNumber(point.x) || !isFiniteNumber(point.y)) return [];
    if (!isWithinViewport(point, window.innerWidth, window.innerHeight)) return [];

    return [{ ...point, feature }];
  });

const treeToOverlayItem = (
  tree: ProjectedTree,
  selectedTreeUri: string | null,
): TreeOverlayItem => ({
  kind: "tree",
  id: String(tree.feature.id),
  x: tree.x,
  y: tree.y,
  selected: tree.feature.properties.occurrenceUri === selectedTreeUri,
  feature: tree.feature,
});

const buildTreeOverlayItems = (
  projectedTrees: ProjectedTree[],
  selectedTreeUri: string | null,
  altitude: number,
): TreeOverlayItem[] => {
  if (altitude <= CLOSE_VIEW_INDIVIDUAL_TREE_ALTITUDE) {
    return projectedTrees.map((tree) => treeToOverlayItem(tree, selectedTreeUri));
  }

  const groupedTrees = new Map<string, ProjectedTree[]>();

  for (const tree of projectedTrees) {
    const key = getClusterKey(tree);
    const group = groupedTrees.get(key);
    if (group) {
      group.push(tree);
    } else {
      groupedTrees.set(key, [tree]);
    }
  }

  return Array.from(groupedTrees.entries()).flatMap(([key, group]) => {
    if (group.length < MIN_CLUSTER_COUNT) {
      return group.map((tree) => treeToOverlayItem(tree, selectedTreeUri));
    }

    const selectedTrees = selectedTreeUri
      ? group.filter((tree) => tree.feature.properties.occurrenceUri === selectedTreeUri)
      : [];
    const x = group.reduce((total, tree) => total + tree.x, 0) / group.length;
    const y = group.reduce((total, tree) => total + tree.y, 0) / group.length;

    return [
      {
        kind: "cluster" as const,
        id: `cluster-${key}`,
        x,
        y,
        count: group.length,
        radius: getClusterRadius(group.length),
      },
      ...selectedTrees.map((tree) => ({
        kind: "tree" as const,
        id: String(tree.feature.id),
        x: tree.x,
        y: tree.y,
        selected: true,
        feature: tree.feature,
      })),
    ];
  });
};

const TreeClusterOverlay = () => {
  const mapRef = useMapStore((state) => state.mapRef);
  const mapLoaded = useMapStore((state) => state.mapLoaded);
  const currentView = useMapStore((state) => state.currentView);
  const treeOverlayReady = useMapStore((state) => state.treeOverlayReady);
  const setTreeOverlayReady = useMapStore((state) => state.setTreeOverlayReady);
  const activeProjectId = useProjectOverlayStore((state) => state.projectId);
  const treesAsync = useProjectOverlayStore((state) => state.treesAsync);
  const previewSelectedTreeUri = usePreviewStore((state) => state.treeUri);
  const selectedTreeInformation = useHoveredTreeOverlayStore(
    (state) => state.selectedTreeInformation,
  );
  const setTreeInformation = useHoveredTreeOverlayStore(
    (state) => state.setTreeInformation,
  );
  const setSelectedTreeInformation = useHoveredTreeOverlayStore(
    (state) => state.setSelectedTreeInformation,
  );
  const clearSelectedTreeInformation = useHoveredTreeOverlayStore(
    (state) => state.clearSelectedTreeInformation,
  );
  const [items, setItems] = useState<TreeOverlayItem[]>([]);

  const clearHover = useCallback(() => {
    setTreeInformation(selectedTreeInformation);
  }, [selectedTreeInformation, setTreeInformation]);

  const update = useCallback(() => {
    const globe = mapRef?.current;
    const trees = treesAsync?._status === "success" ? treesAsync.data : null;

    if (
      currentView !== "project" ||
      !activeProjectId ||
      !mapLoaded ||
      !globe ||
      !trees?.features.length
    ) {
      setItems([]);
      if (treeOverlayReady) {
        setTreeOverlayReady(false);
      }
      clearSelectedTreeInformation();
      return;
    }

    const altitude = globe.getPointOfView().altitude ?? 2.5;
    if (altitude > MAX_TREE_OVERLAY_ALTITUDE) {
      setItems([]);
      setTreeInformation(selectedTreeInformation);
      return;
    }

    const projectedTrees = projectTrees(
      trees.features as NormalizedTreeFeature[],
      (lng, lat) => globe.getScreenCoords(lng, lat),
    );
    const nextItems = buildTreeOverlayItems(
      projectedTrees,
      previewSelectedTreeUri ?? selectedTreeInformation?.treeUri ?? null,
      altitude,
    );
    setItems(nextItems);
    if (nextItems.length > 0 && !treeOverlayReady) {
      setTreeOverlayReady(true);
    }
  }, [
    activeProjectId,
    currentView,
    mapLoaded,
    mapRef,
    clearSelectedTreeInformation,
    previewSelectedTreeUri,
    selectedTreeInformation,
    setTreeInformation,
    setTreeOverlayReady,
    treeOverlayReady,
    treesAsync,
  ]);

  const handleTreeMouseEnter = useCallback(
    (feature: NormalizedTreeFeature) => {
      if (!activeProjectId) return;
      setTreeInformation(getTreeInformationFromFeature(feature, activeProjectId));
    },
    [activeProjectId, setTreeInformation],
  );

  const handleTreeClick = useCallback(
    (event: React.MouseEvent<SVGCircleElement>, feature: NormalizedTreeFeature) => {
      event.stopPropagation();
      if (!activeProjectId) return;
      setSelectedTreeInformation(
        getTreeInformationFromFeature(feature, activeProjectId),
      );
    },
    [activeProjectId, setSelectedTreeInformation],
  );

  useEffect(() => {
    update();
  }, [update]);

  useEffect(() => {
    const globe = mapRef?.current;
    if (!mapLoaded || !globe) return;

    update();
    return globe.onMove(update);
  }, [mapLoaded, mapRef, update]);

  useEffect(
    () => () => {
      clearSelectedTreeInformation();
      setTreeInformation(null);
    },
    [clearSelectedTreeInformation, setTreeInformation],
  );

  if (items.length === 0) return null;

  return (
    <svg
      aria-hidden="true"
      className="tree-cluster-overlay"
      data-testid="tree-cluster-overlay"
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 11 }}
    >
      {items.map((item) =>
        item.kind === "cluster" ? (
          <g key={item.id} className="tree-cluster" data-testid="tree-cluster">
            <circle
              cx={item.x}
              cy={item.y}
              r={item.radius}
              fill="rgba(255, 119, 193, 0.48)"
              stroke="rgba(255, 119, 193, 0.75)"
              strokeWidth={1.5}
            />
            <text
              x={item.x}
              y={item.y}
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#0b0b0b"
              fontSize={Math.max(12, Math.min(18, item.radius * 0.48))}
              fontWeight={700}
              paintOrder="stroke"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth={2}
              data-testid="tree-cluster-label"
            >
              {item.count}
            </text>
          </g>
        ) : (
          <circle
            key={item.id}
            className="tree-dot"
            data-testid="tree-dot"
            cx={item.x}
            cy={item.y}
            r={item.selected ? SELECTED_TREE_DOT_RADIUS_PX : TREE_DOT_RADIUS_PX}
            fill={item.selected ? "#ec4899" : "#ff77c1"}
            stroke={item.selected ? "#ffffff" : "#000000"}
            strokeWidth={item.selected ? 3 : 1}
            onClick={(event) => handleTreeClick(event, item.feature)}
            onMouseEnter={() => handleTreeMouseEnter(item.feature)}
            onMouseLeave={clearHover}
          />
        ),
      )}
    </svg>
  );
};

export default TreeClusterOverlay;
