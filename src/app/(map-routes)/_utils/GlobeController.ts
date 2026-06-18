import type { GlobeInstance } from "globe.gl";
import { AmbientLight, DirectionalLight, type PerspectiveCamera } from "three";
import {
  GLOBE_CONFIG,
  GLOBE_INITIAL_POINT_OF_VIEW,
  getLandcoverTileUrl,
  getSatelliteTileUrl,
} from "@/config/map";
import type {
  GlobeBounds,
  GlobeHtmlDatum,
  GlobePathDatum,
  GlobePointDatum,
  GlobePointOfView,
  GlobePolygonDatum,
} from "./globe-data";
import {
  boundsToCameraZoom,
  boundsToPointOfView,
  featureCollectionToPolygons,
  geoJsonToPointData,
  pointOfViewToApproxBounds,
} from "./globe-data";

export type TileUrlFactory = (x: number, y: number, level: number) => string;

type GlobeInstanceWithTileControls = GlobeInstance & {
  globeTileEngineMaxLevel: (level: number) => GlobeInstance;
  globeTileEngineUrl: (tileUrlFactory: TileUrlFactory | null) => GlobeInstance;
};

export type GlobeControllerCallbacks = {
  onProjectMarkerClick?: (did: string) => void;
  onTreeHover?: (point: GlobePointDatum | null) => void;
  onHighlightedPolygonClick?: () => void;
};

const isTreePoint = (point: GlobePointDatum | null): point is GlobePointDatum =>
  point?.kind === "tree";

const CONTROL_SENSITIVITY = {
  minRotateSpeed: 0.00004,
  maxRotateSpeed: 0.46,
  rotateSpeedAltitudeFactor: 0.12,
  minZoomSpeed: 0.01,
  maxZoomSpeed: 0.16,
  zoomSpeedAltitudeFactor: 0.04,
  dampingFactor: 0.1,
};

const WHEEL_ZOOM = {
  minAltitude: 0.00008,
  maxAltitude: 2.8,
  scale: 0.00055,
  maxDeltaPx: 160,
  smoothing: 0.18,
};

export class GlobeController {
  private callbacks: GlobeControllerCallbacks;
  private resizeObserver: ResizeObserver | null = null;
  private moveListeners = new Set<() => void>();
  private projectMarkers: GlobeHtmlDatum[] = [];
  private activeProjectMarker: GlobeHtmlDatum | null = null;
  private projectMarkersVisible = true;
  private htmlLayers = new Map<string, GlobeHtmlDatum[]>();
  private treePoints: GlobePointDatum[] = [];
  private treesVisible = true;
  private hoveredTreeId: string | number | null = null;
  private selectedTreeId: string | number | null = null;
  private dynamicPointLayers = new Map<string, GlobePointDatum[]>();
  private polygonLayers = new Map<string, GlobePolygonDatum[]>();
  private pathLayers = new Map<string, GlobePathDatum[]>();
  private rasterTileLayers = new Map<string, TileUrlFactory>();
  private activeRasterLayerName: string | null = null;
  private landcoverVisible = false;
  private activeTileEngineMode: string | null = null;
  private closeSatelliteTilesActive = false;
  private cameraZoomAnimationFrame: number | null = null;
  private moveAnimationFrame: number | null = null;
  private wheelZoomAnimationFrame: number | null = null;
  private wheelZoomTargetAltitude: number | null = null;
  private lastWheelZoomAt = 0;
  private cameraTransitionEndsAt = 0;
  private readonly stopAutoRotate = () => {
    this.globe.controls().autoRotate = false;
  };
  private readonly interruptCameraMotion = () => {
    this.stopAutoRotate();

    if (this.cameraZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.cameraZoomAnimationFrame);
      this.cameraZoomAnimationFrame = null;
    }
    if (this.wheelZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.wheelZoomAnimationFrame);
      this.wheelZoomAnimationFrame = null;
      this.wheelZoomTargetAltitude = null;
    }

    // Cancel any in-flight pointOfView tween so a user drag never fights
    // the project-selection zoom animation.
    this.globe.pointOfView(this.globe.pointOfView(), 0);
    this.cameraTransitionEndsAt = 0;
  };
  private readonly handleControlsChange = () => {
    this.syncControlsSensitivity();
    this.syncTileEngine();
    this.emitMove();
  };
  private readonly handleWheelZoom = (event: WheelEvent) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    this.stopAutoRotate();

    if (performance.now() < this.cameraTransitionEndsAt) {
      this.interruptCameraMotion();
    }
    if (this.cameraZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.cameraZoomAnimationFrame);
      this.cameraZoomAnimationFrame = null;
    }

    const pov = this.globe.pointOfView();
    const currentAltitude = Math.max(
      WHEEL_ZOOM.minAltitude,
      Math.min(WHEEL_ZOOM.maxAltitude, pov.altitude ?? GLOBE_INITIAL_POINT_OF_VIEW.altitude),
    );
    const baseAltitude = this.wheelZoomTargetAltitude ?? currentAltitude;
    const pixelDelta =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    const clampedDelta = Math.max(
      -WHEEL_ZOOM.maxDeltaPx,
      Math.min(WHEEL_ZOOM.maxDeltaPx, pixelDelta),
    );

    this.wheelZoomTargetAltitude = Math.max(
      WHEEL_ZOOM.minAltitude,
      Math.min(
        WHEEL_ZOOM.maxAltitude,
        baseAltitude * Math.exp(clampedDelta * WHEEL_ZOOM.scale),
      ),
    );
    this.lastWheelZoomAt = performance.now();
    this.animateWheelZoom();
  };

  constructor(
    private readonly globe: GlobeInstance,
    private readonly container: HTMLElement,
    callbacks: GlobeControllerCallbacks = {},
  ) {
    this.callbacks = callbacks;
    this.configureGlobe();
    this.attachResizeObserver();
    this.attachInteractionHandlers();
  }

  static async create(
    container: HTMLElement,
    callbacks: GlobeControllerCallbacks = {},
  ): Promise<GlobeController> {
    const { default: Globe } = await import("globe.gl");
    const globe = new Globe(container, {
      animateIn: false,
      waitForGlobeReady: false,
      rendererConfig: { antialias: true, alpha: true },
    });

    return new GlobeController(globe, container, callbacks);
  }

  setCallbacks(callbacks: GlobeControllerCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  setProjectMarkers(markers: GlobeHtmlDatum[]) {
    this.projectMarkers = markers;
    this.renderHtmlLayers();
  }

  setActiveProjectMarker(marker: GlobeHtmlDatum | null) {
    this.activeProjectMarker = marker;
    this.renderHtmlLayers();
  }

  setProjectMarkersVisible(visible: boolean) {
    this.projectMarkersVisible = visible;
    this.renderHtmlLayers();
  }

  setHtmlLayer(layerName: string, markers: GlobeHtmlDatum[]) {
    this.htmlLayers.set(layerName, markers);
    this.renderHtmlLayers();
  }

  removeHtmlLayer(layerName: string) {
    this.htmlLayers.delete(layerName);
    this.renderHtmlLayers();
  }

  setHighlightedPolygon(polygon: GeoJSON.FeatureCollection | null) {
    const polygons = featureCollectionToPolygons(polygon, {
      kind: "highlighted-site",
      layerName: "highlighted-site",
      capColor: "rgba(255, 234, 0, 0)",
      sideColor: "rgba(255, 234, 0, 0)",
      strokeColor: false,
      altitude: 0,
    });

    this.setPolygonLayer("highlighted-site", polygons);
    this.setPathLayer("highlighted-site-outline", []);
  }

  setTrees(trees: GeoJSON.FeatureCollection | null) {
    // Raw globe.gl cylinders become unusably large at project-site zoom.
    // Keep the data conversion path intact for hover/cluster work, but defer
    // visible tree rendering to the dedicated Phase 2 clustered overlay.
    this.treePoints = geoJsonToPointData(trees, {
      kind: "tree",
      layerName: "trees",
      color: "#ff77c1",
      radius: 0,
    }).filter(() => false);
    this.renderPoints();
  }

  setTreesVisible(visible: boolean) {
    this.treesVisible = visible;
    this.renderPoints();
  }

  setSelectedTreeId(featureId: string | number | null) {
    this.selectedTreeId = featureId;
    this.renderPoints();
  }

  setDynamicPointLayer(layerName: string, points: GlobePointDatum[]) {
    this.dynamicPointLayers.set(layerName, points);
    this.renderPoints();
  }

  setPolygonLayer(layerName: string, polygons: GlobePolygonDatum[]) {
    this.polygonLayers.set(layerName, polygons);
    this.renderPolygons();
  }

  setPathLayer(layerName: string, paths: GlobePathDatum[]) {
    this.pathLayers.set(layerName, paths);
    this.renderPaths();
  }

  setRasterTileLayer(layerName: string, tileUrlFactory: TileUrlFactory) {
    this.rasterTileLayers.set(layerName, tileUrlFactory);
    this.activeRasterLayerName = layerName;
    this.activeTileEngineMode = null;
    this.syncTileEngine();
  }

  setLandcoverVisible(visible: boolean) {
    if (this.landcoverVisible === visible) return;

    this.landcoverVisible = visible;
    this.syncTileEngine();
  }

  removeDynamicLayer(layerName: string) {
    const removedPoints = this.dynamicPointLayers.delete(layerName);
    const removedPolygons = this.polygonLayers.delete(layerName);
    const removedPaths = this.pathLayers.delete(layerName);
    const removedRaster = this.rasterTileLayers.delete(layerName);

    if (removedRaster && this.activeRasterLayerName === layerName) {
      this.activeRasterLayerName = Array.from(this.rasterTileLayers.keys()).at(-1) ?? null;
    }

    if (removedPoints) this.renderPoints();
    if (removedPolygons) this.renderPolygons();
    if (removedPaths) this.renderPaths();
    if (removedRaster) this.syncTileEngine();
  }

  fitBounds(
    bounds: GlobeBounds | null,
    options: { extraLeftPadding?: boolean; animate?: boolean } = {},
  ) {
    const transitionMs = options.animate === false ? 0 : 1800;
    const pov = boundsToPointOfView(bounds);
    const cameraZoom = boundsToCameraZoom(bounds);

    this.stopAutoRotate();
    this.cameraTransitionEndsAt = performance.now() + transitionMs;
    this.globe.globeOffset([options.extraLeftPadding ? 240 : 0, 0]);
    this.animateCameraZoom(cameraZoom, transitionMs);
    this.globe.pointOfView(pov, transitionMs);
    window.setTimeout(() => {
      this.cameraTransitionEndsAt = 0;
      this.syncTileEngine();
      this.emitMove();
    }, transitionMs);
  }

  private animateWheelZoom() {
    if (this.wheelZoomAnimationFrame !== null) return;

    const step = () => {
      const targetAltitude = this.wheelZoomTargetAltitude;
      if (targetAltitude === null) {
        this.wheelZoomAnimationFrame = null;
        return;
      }

      const pov = this.globe.pointOfView();
      const currentAltitude = Math.max(
        WHEEL_ZOOM.minAltitude,
        Math.min(
          WHEEL_ZOOM.maxAltitude,
          pov.altitude ?? GLOBE_INITIAL_POINT_OF_VIEW.altitude,
        ),
      );
      const delta = targetAltitude - currentAltitude;
      const tolerance = Math.max(0.000001, Math.abs(targetAltitude) * 0.003);
      const nextAltitude =
        Math.abs(delta) <= tolerance
          ? targetAltitude
          : currentAltitude + delta * WHEEL_ZOOM.smoothing;

      this.globe.pointOfView(
        {
          ...pov,
          altitude: nextAltitude,
        },
        0,
      );
      this.syncControlsSensitivity();
      this.syncTileEngine(nextAltitude);
      this.emitMove();

      if (
        Math.abs(targetAltitude - nextAltitude) <= tolerance &&
        performance.now() - this.lastWheelZoomAt > 100
      ) {
        this.wheelZoomTargetAltitude = null;
        this.wheelZoomAnimationFrame = null;
        return;
      }

      this.wheelZoomAnimationFrame = requestAnimationFrame(step);
    };

    this.wheelZoomAnimationFrame = requestAnimationFrame(step);
  }

  private animateCameraZoom(targetZoom: number, transitionMs: number) {
    if (this.cameraZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.cameraZoomAnimationFrame);
      this.cameraZoomAnimationFrame = null;
    }

    const camera = this.globe.camera() as PerspectiveCamera;
    const startZoom = camera.zoom || 1;
    const safeTargetZoom = Math.max(0.5, targetZoom);

    if (transitionMs === 0 || Math.abs(startZoom - safeTargetZoom) < 0.001) {
      camera.zoom = safeTargetZoom;
      camera.updateProjectionMatrix();
      this.emitMove();
      return;
    }

    const start = performance.now();
    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / transitionMs);
      const eased = easeInOut(progress);
      camera.zoom = startZoom + (safeTargetZoom - startZoom) * eased;
      camera.updateProjectionMatrix();
      this.emitMove();

      if (progress < 1) {
        this.cameraZoomAnimationFrame = requestAnimationFrame(step);
      } else {
        this.cameraZoomAnimationFrame = null;
      }
    };

    this.cameraZoomAnimationFrame = requestAnimationFrame(step);
  }

  getApproxBounds(): GlobeBounds | null {
    return pointOfViewToApproxBounds(this.globe.pointOfView());
  }

  getPointOfView(): Partial<GlobePointOfView> {
    return this.globe.pointOfView();
  }

  getScreenCoords(lng: number, lat: number, altitude = 0) {
    const coords = this.globe.getScreenCoords(lat, lng, altitude);
    const rect = this.container.getBoundingClientRect();

    return {
      x: rect.left + coords.x,
      y: rect.top + coords.y,
    };
  }

  getContainer() {
    return this.container;
  }

  onMove(listener: () => void) {
    this.moveListeners.add(listener);
    return () => {
      this.moveListeners.delete(listener);
    };
  }

  destroy() {
    this.resizeObserver?.disconnect();
    if (this.cameraZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.cameraZoomAnimationFrame);
      this.cameraZoomAnimationFrame = null;
    }
    if (this.moveAnimationFrame !== null) {
      cancelAnimationFrame(this.moveAnimationFrame);
      this.moveAnimationFrame = null;
    }
    if (this.wheelZoomAnimationFrame !== null) {
      cancelAnimationFrame(this.wheelZoomAnimationFrame);
      this.wheelZoomAnimationFrame = null;
    }
    this.globe.controls().removeEventListener("change", this.handleControlsChange);
    this.container.removeEventListener("pointerdown", this.interruptCameraMotion);
    this.container.removeEventListener("wheel", this.handleWheelZoom, { capture: true });
    this.moveListeners.clear();
    this.globe._destructor();
    this.container.replaceChildren();
  }

  private configureGlobe() {
    this.resize();
    this.globe
      .backgroundColor(GLOBE_CONFIG.backgroundColor)
      .backgroundImageUrl(GLOBE_CONFIG.backgroundImageUrl)
      .globeImageUrl(GLOBE_CONFIG.globeImageUrl)
      .bumpImageUrl(GLOBE_CONFIG.bumpImageUrl)
      .globeCurvatureResolution(GLOBE_CONFIG.globeCurvatureResolution)
      .showAtmosphere(true)
      .atmosphereColor(GLOBE_CONFIG.atmosphereColor)
      .atmosphereAltitude(GLOBE_CONFIG.atmosphereAltitude)
      .showGraticules(GLOBE_CONFIG.showGraticules)
      .pointLat((point) => (point as GlobePointDatum).lat)
      .pointLng((point) => (point as GlobePointDatum).lng)
      .pointAltitude((point) => (isTreePoint(point as GlobePointDatum) ? 0 : 0.006))
      .pointRadius((point) => this.getPointRadius(point as GlobePointDatum))
      .pointColor((point) => this.getPointColor(point as GlobePointDatum))
      .pointResolution(10)
      .pointsMerge(false)
      .pointLabel((point) => (point as GlobePointDatum).label ?? "")
      .onPointHover((point) => this.handlePointHover(point as GlobePointDatum | null))
      .polygonGeoJsonGeometry(
        (polygon) =>
          (polygon as GlobePolygonDatum).geometry as unknown as {
            type: string;
            coordinates: number[];
          },
      )
      .polygonAltitude((polygon) => (polygon as GlobePolygonDatum).altitude)
      .polygonCapColor((polygon) => (polygon as GlobePolygonDatum).capColor)
      .polygonSideColor((polygon) => (polygon as GlobePolygonDatum).sideColor)
      .polygonStrokeColor((polygon) => (polygon as GlobePolygonDatum).strokeColor)
      .polygonLabel((polygon) => (polygon as GlobePolygonDatum).label ?? "")
      .onPolygonClick((polygon) => this.handlePolygonClick(polygon as GlobePolygonDatum))
      .polygonsTransitionDuration(250)
      .pathPoints((path: object) => (path as GlobePathDatum).points)
      .pathPointLat((point) => (point as [number, number])[0])
      .pathPointLng((point) => (point as [number, number])[1])
      .pathPointAlt(0.012)
      .pathColor((path: object) => (path as GlobePathDatum).color)
      .pathStroke((path: object) => (path as GlobePathDatum).stroke)
      .pathLabel((path: object) => (path as GlobePathDatum).label ?? "")
      .htmlLat((marker) => (marker as GlobeHtmlDatum).lat)
      .htmlLng((marker) => (marker as GlobeHtmlDatum).lng)
      .htmlAltitude(0)
      .htmlTransitionDuration(0)
      .htmlElement((marker) => this.createHtmlMarker(marker as GlobeHtmlDatum))
      .htmlElementVisibilityModifier((element, isVisible) => {
        element.style.opacity = isVisible ? "1" : "0";
        element.style.pointerEvents = isVisible ? "auto" : "none";
      })
      .showPointerCursor((_, data) => {
        const datum = data as { kind?: string } | undefined;
        return datum?.kind === "tree" || datum?.kind === "highlighted-site";
      })
      .onZoom(() => {
        this.syncTileEngine();
        this.emitMove();
      })
      .pointOfView(GLOBE_INITIAL_POINT_OF_VIEW, 0);

    this.configureLights();

    (this.globe as GlobeInstanceWithTileControls).globeTileEngineMaxLevel(
      GLOBE_CONFIG.tileEngineMaxLevel,
    );
    this.syncTileEngine();

    const camera = this.globe.camera() as PerspectiveCamera;
    camera.near = 0.001;
    camera.updateProjectionMatrix();

    const controls = this.globe.controls();
    const initialAltitude =
      this.globe.pointOfView().altitude ?? GLOBE_INITIAL_POINT_OF_VIEW.altitude;
    const globeRadius = camera.position.length() / (1 + initialAltitude);
    controls.minDistance = globeRadius * 1.00008;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 360 / GLOBE_CONFIG.secondsPerRevolution / 6;
    controls.enableDamping = true;
    controls.dampingFactor = CONTROL_SENSITIVITY.dampingFactor;
    this.syncControlsSensitivity();
    controls.addEventListener("change", this.handleControlsChange);
  }

  private configureLights() {
    const keyLight = new DirectionalLight(
      GLOBE_CONFIG.keyLightColor,
      GLOBE_CONFIG.keyLightIntensity,
    );
    keyLight.position.set(
      GLOBE_CONFIG.keyLightPosition[0],
      GLOBE_CONFIG.keyLightPosition[1],
      GLOBE_CONFIG.keyLightPosition[2],
    );

    const fillLight = new DirectionalLight(
      GLOBE_CONFIG.fillLightColor,
      GLOBE_CONFIG.fillLightIntensity,
    );
    fillLight.position.set(
      GLOBE_CONFIG.fillLightPosition[0],
      GLOBE_CONFIG.fillLightPosition[1],
      GLOBE_CONFIG.fillLightPosition[2],
    );

    this.globe.lights([
      new AmbientLight(
        GLOBE_CONFIG.ambientLightColor,
        GLOBE_CONFIG.ambientLightIntensity,
      ),
      keyLight,
      fillLight,
    ]);
  }

  private attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.container);
  }

  private attachInteractionHandlers() {
    this.container.addEventListener("pointerdown", this.interruptCameraMotion);
    this.container.addEventListener("wheel", this.handleWheelZoom, {
      capture: true,
      passive: false,
    });
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    this.globe.width(Math.max(1, Math.round(rect.width || window.innerWidth)));
    this.globe.height(Math.max(1, Math.round(rect.height || window.innerHeight)));
    this.emitMove();
  }

  private renderHtmlLayers() {
    const activeMarkerIds = new Set(
      this.activeProjectMarker
        ? [this.activeProjectMarker.id, this.activeProjectMarker.did].filter(
            (id): id is string => typeof id === "string",
          )
        : [],
    );
    const projectMarkers = this.projectMarkersVisible
      ? this.projectMarkers.filter(
          (marker) =>
            !activeMarkerIds.has(marker.id) &&
            (marker.did === undefined || !activeMarkerIds.has(marker.did)),
        )
      : [];

    this.globe.htmlElementsData([
      ...projectMarkers,
      ...(this.activeProjectMarker ? [this.activeProjectMarker] : []),
      ...Array.from(this.htmlLayers.values()).flat(),
    ]);
  }

  private renderPoints() {
    this.globe.pointsData([
      ...(this.treesVisible ? this.treePoints : []),
      ...Array.from(this.dynamicPointLayers.values()).flat(),
    ]);
  }

  private renderPolygons() {
    this.globe.polygonsData(Array.from(this.polygonLayers.values()).flat());
    this.emitMove();
  }

  private renderPaths() {
    this.globe.pathsData(Array.from(this.pathLayers.values()).flat());
  }

  private syncTileEngine(altitudeOverride?: number) {
    const activeRaster = this.activeRasterLayerName
      ? this.rasterTileLayers.get(this.activeRasterLayerName)
      : null;
    const nextTileEngine = this.resolveTileEngine(activeRaster ?? null, altitudeOverride);

    if (nextTileEngine.mode === this.activeTileEngineMode) return;

    this.activeTileEngineMode = nextTileEngine.mode;

    // Clear stale tiles before changing the URL. `globeTileEngineUrl(...)`
    // triggers the slippy engine to update/fetch for the current camera; doing
    // the clear after that update leaves the globe blank until the next move.
    this.globe.globeTileEngineClearCache();
    (this.globe as GlobeInstanceWithTileControls).globeTileEngineMaxLevel(
      nextTileEngine.maxLevel,
    );
    (this.globe as GlobeInstanceWithTileControls).globeTileEngineUrl(
      nextTileEngine.tileUrlFactory,
    );
  }

  private resolveTileEngine(
    activeRaster: TileUrlFactory | null,
    altitudeOverride?: number,
  ): {
    mode: string;
    tileUrlFactory: TileUrlFactory | null;
    maxLevel: number;
  } {
    if (activeRaster && this.activeRasterLayerName) {
      return {
        mode: `raster:${this.activeRasterLayerName}`,
        tileUrlFactory: activeRaster,
        maxLevel: GLOBE_CONFIG.tileEngineMaxLevel,
      };
    }

    if (this.landcoverVisible) {
      return {
        mode: "landcover",
        tileUrlFactory: getLandcoverTileUrl,
        maxLevel: GLOBE_CONFIG.landcoverTileEngineMaxLevel,
      };
    }

    if (this.shouldUseCloseSatelliteTiles(altitudeOverride)) {
      return {
        mode: "satellite",
        tileUrlFactory: getSatelliteTileUrl,
        maxLevel: GLOBE_CONFIG.tileEngineMaxLevel,
      };
    }

    return {
      mode: "blue-marble",
      tileUrlFactory: null,
      maxLevel: GLOBE_CONFIG.tileEngineMaxLevel,
    };
  }

  private shouldUseCloseSatelliteTiles(altitudeOverride?: number) {
    const altitude = Math.max(
      0,
      altitudeOverride ??
        this.globe.pointOfView().altitude ??
        GLOBE_INITIAL_POINT_OF_VIEW.altitude,
    );

    if (this.closeSatelliteTilesActive) {
      this.closeSatelliteTilesActive =
        altitude <= GLOBE_CONFIG.closeSatelliteTileDisableAltitude;
    } else {
      this.closeSatelliteTilesActive =
        altitude <= GLOBE_CONFIG.closeSatelliteTileEnableAltitude;
    }

    return this.closeSatelliteTilesActive;
  }

  private getPointColor(point: GlobePointDatum) {
    if (isTreePoint(point)) {
      if (this.selectedTreeId === point.id) return "#ec4899";
      if (this.hoveredTreeId === point.id) return "#0883fe";
    }

    return point.color;
  }

  private getPointRadius(point: GlobePointDatum) {
    if (isTreePoint(point)) {
      if (this.selectedTreeId === point.id) return 0.00008;
      if (this.hoveredTreeId === point.id) return 0.00005;
    }

    return point.radius;
  }

  private handlePointHover(point: GlobePointDatum | null) {
    const nextHoveredTreeId = isTreePoint(point) ? point.id : null;
    if (this.hoveredTreeId !== nextHoveredTreeId) {
      this.hoveredTreeId = nextHoveredTreeId;
      this.renderPoints();
    }

    this.callbacks.onTreeHover?.(isTreePoint(point) ? point : null);
  }

  private handlePolygonClick(polygon: GlobePolygonDatum) {
    if (polygon.kind === "highlighted-site") {
      this.callbacks.onHighlightedPolygonClick?.();
    }
  }

  private createHtmlMarker(marker: GlobeHtmlDatum) {
    const element = document.createElement("button");
    element.type = "button";
    element.title = marker.label;
    element.setAttribute("aria-label", marker.label);
    element.dataset.markerId = marker.id;
    element.dataset.lat = String(marker.lat);
    element.dataset.lng = String(marker.lng);
    element.className = `globe-html-marker globe-html-marker-${marker.kind}`;

    if (marker.kind === "project-marker") {
      const image = document.createElement("img");
      image.src = "/assets/project-marker.webp";
      image.alt = "";
      image.draggable = false;
      element.appendChild(image);
    } else {
      const pin = document.createElement("span");
      pin.style.backgroundColor = marker.color ?? "#FF00FF";
      element.appendChild(pin);
    }

    element.addEventListener("click", (event) => {
      event.stopPropagation();
      if (marker.kind === "project-marker" && marker.did) {
        this.callbacks.onProjectMarkerClick?.(marker.did);
      }
    });

    return element;
  }

  private syncControlsSensitivity() {
    const controls = this.globe.controls();
    const altitude = Math.max(0, this.globe.pointOfView().altitude ?? 2.5);

    // Keep far-away globe rotation fluid without making close-up project-site
    // drags jump across large distances. A small floor prevents the previous
    // stuck feeling, while the altitude factor restores speed as users zoom out.
    controls.rotateSpeed = Math.max(
      CONTROL_SENSITIVITY.minRotateSpeed,
      Math.min(
        CONTROL_SENSITIVITY.maxRotateSpeed,
        CONTROL_SENSITIVITY.minRotateSpeed +
          altitude * CONTROL_SENSITIVITY.rotateSpeedAltitudeFactor,
      ),
    );
    controls.zoomSpeed = Math.max(
      CONTROL_SENSITIVITY.minZoomSpeed,
      Math.min(
        CONTROL_SENSITIVITY.maxZoomSpeed,
        CONTROL_SENSITIVITY.minZoomSpeed +
          Math.sqrt(altitude) * CONTROL_SENSITIVITY.zoomSpeedAltitudeFactor,
      ),
    );
  }

  private emitMove() {
    if (this.moveAnimationFrame !== null) return;

    this.moveAnimationFrame = requestAnimationFrame(() => {
      this.moveAnimationFrame = null;
      for (const listener of this.moveListeners) {
        listener();
      }
    });
  }
}
