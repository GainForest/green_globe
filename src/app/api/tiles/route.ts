import { getRawSatelliteTileUrl } from "@/config/map";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TILE_SIZE = 256;
const TILE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
];

const EXTERNAL_LAYER_SOURCE_HOSTS = new Set([
  // Legacy XPRIZE drone orthomosaic bucket used by migrated organization layers.
  "xprize-finals.s3.eu-west-3.amazonaws.com",
]);

type TileMode = "satellite" | "raster-with-basemap";
type ImageTile = {
  buffer: Buffer;
  contentType: string;
};

const isPrivateHost = (hostname: string): boolean =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

const isAllowedLayerSourceUrl = (url: URL): boolean => {
  if (url.protocol !== "https:" || isPrivateHost(url.hostname)) return false;

  const storageOrigin = process.env.NEXT_PUBLIC_AWS_STORAGE;
  const storageHostname = storageOrigin
    ? new URL(storageOrigin).hostname
    : null;

  return (
    url.hostname === storageHostname ||
    EXTERNAL_LAYER_SOURCE_HOSTS.has(url.hostname)
  );
};

const isAllowedTitilerTileUrl = (url: URL): boolean => {
  if (url.protocol !== "https:" || isPrivateHost(url.hostname)) return false;

  const titilerOrigin = process.env.NEXT_PUBLIC_TITILER_ENDPOINT;
  const titilerHostname = titilerOrigin
    ? new URL(titilerOrigin).hostname
    : null;

  if (url.hostname !== titilerHostname) return false;
  if (!/^\/cog\/tiles\/WebMercatorQuad\/\d+\/\d+\/\d+@1x$/.test(url.pathname)) {
    return false;
  }

  const nestedSourceUrl = url.searchParams.get("url");
  if (!nestedSourceUrl) return false;

  try {
    return isAllowedLayerSourceUrl(new URL(nestedSourceUrl));
  } catch {
    return false;
  }
};

const isAllowedRemoteTileUrl = (url: URL): boolean =>
  isAllowedLayerSourceUrl(url) || isAllowedTitilerTileUrl(url);

const parseTileNumber = (
  request: NextRequest,
  name: string,
): number | null => {
  const rawValue = request.nextUrl.searchParams.get(name);
  if (rawValue === null) return null;

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

const parseTileMode = (request: NextRequest): TileMode | null => {
  const mode = request.nextUrl.searchParams.get("mode");
  return mode === "satellite" || mode === "raster-with-basemap" ? mode : null;
};

const fetchImageBuffer = async (url: string): Promise<ImageTile | null> => {
  const response = await fetch(url, {
    headers: {
      Accept: "image/avif,image/webp,image/png,image/jpeg,image/*,*/*;q=0.8",
    },
    next: { revalidate: 86400 },
    redirect: "manual",
  });

  if (!response.ok) return null;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/")) return null;

  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentType,
  };
};

const fetchSatelliteTile = async (
  x: number,
  y: number,
  z: number,
): Promise<ImageTile | null> => fetchImageBuffer(getRawSatelliteTileUrl(x, y, z));

const toDataUri = ({ buffer, contentType }: ImageTile) =>
  `data:${contentType};base64,${buffer.toString("base64")}`;

const imageResponse = (buffer: Buffer, contentType = "image/jpeg") => {
  const body = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  return new NextResponse(body, {
    headers: {
      "Cache-Control": TILE_CACHE_CONTROL,
      "Content-Type": contentType,
    },
  });
};

const svgResponse = (svg: string) =>
  new NextResponse(svg, {
    headers: {
      "Cache-Control": TILE_CACHE_CONTROL,
      "Content-Type": "image/svg+xml",
    },
  });

const svgCompositeResponse = (
  satelliteTile: ImageTile,
  rasterTile: ImageTile,
) =>
  svgResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><image href="${toDataUri(satelliteTile)}" width="256" height="256"/><image href="${toDataUri(rasterTile)}" width="256" height="256"/></svg>`,
  );

const svgSupertileResponse = (
  tiles: Array<ImageTile & { left: number; top: number }>,
  scale: number,
) => {
  const size = TILE_SIZE * scale;
  const images = tiles
    .map(
      (tile) =>
        `<image href="${toDataUri(tile)}" x="${tile.left}" y="${tile.top}" width="${TILE_SIZE}" height="${TILE_SIZE}"/>`,
    )
    .join("");

  return svgResponse(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${images}</svg>`,
  );
};

const handleSatelliteTile = async (request: NextRequest) => {
  const x = parseTileNumber(request, "x");
  const y = parseTileNumber(request, "y");
  const z = parseTileNumber(request, "z");
  const requestedOffset = parseTileNumber(request, "sourceZoomOffset") ?? 1;
  const sourceZoomOffset = Math.max(0, Math.min(2, requestedOffset));

  if (x === null || y === null || z === null) {
    return NextResponse.json(
      { error: "Missing or invalid tile coordinates" },
      { status: 400 },
    );
  }

  if (sourceZoomOffset === 0) {
    const tile = await fetchSatelliteTile(x, y, z);
    if (!tile) {
      return NextResponse.json({ error: "Tile unavailable" }, { status: 502 });
    }
    return imageResponse(tile.buffer, tile.contentType);
  }

  const scale = 2 ** sourceZoomOffset;
  const sourceZ = z + sourceZoomOffset;
  const childTiles = await Promise.all(
    Array.from({ length: scale * scale }, async (_, index) => {
      const dx = index % scale;
      const dy = Math.floor(index / scale);
      const tile = await fetchSatelliteTile(x * scale + dx, y * scale + dy, sourceZ);

      if (!tile) return null;

      return {
        ...tile,
        left: dx * TILE_SIZE,
        top: dy * TILE_SIZE,
      };
    }),
  );
  const composites = childTiles.filter(
    (tile): tile is ImageTile & { left: number; top: number } => Boolean(tile),
  );

  if (!composites.length) {
    const fallbackTile = await fetchSatelliteTile(x, y, z);
    if (!fallbackTile) {
      return NextResponse.json({ error: "Tile unavailable" }, { status: 502 });
    }
    return imageResponse(fallbackTile.buffer, fallbackTile.contentType);
  }

  return svgSupertileResponse(composites, scale);
};

const handleRasterWithBasemapTile = async (request: NextRequest) => {
  const x = parseTileNumber(request, "x");
  const y = parseTileNumber(request, "y");
  const z = parseTileNumber(request, "z");
  const remoteTileUrl = request.nextUrl.searchParams.get("tileUrl");

  if (x === null || y === null || z === null || !remoteTileUrl) {
    return NextResponse.json(
      { error: "Missing or invalid tile coordinates/tileUrl" },
      { status: 400 },
    );
  }

  let parsedRemoteTileUrl: URL;
  try {
    parsedRemoteTileUrl = new URL(remoteTileUrl);
  } catch {
    return NextResponse.json({ error: "Invalid tileUrl" }, { status: 400 });
  }

  if (!isAllowedRemoteTileUrl(parsedRemoteTileUrl)) {
    return NextResponse.json({ error: "Disallowed tileUrl" }, { status: 400 });
  }

  const satelliteTile = await fetchSatelliteTile(x, y, z);
  const rasterTile = await fetchImageBuffer(remoteTileUrl);

  if (satelliteTile && rasterTile) {
    return svgCompositeResponse(satelliteTile, rasterTile);
  }

  if (rasterTile) {
    return imageResponse(rasterTile.buffer, rasterTile.contentType);
  }

  if (satelliteTile) {
    return imageResponse(satelliteTile.buffer, satelliteTile.contentType);
  }

  return NextResponse.json({ error: "Tile unavailable" }, { status: 502 });
};

export async function GET(request: NextRequest) {
  const mode = parseTileMode(request);

  if (mode === "satellite") {
    return handleSatelliteTile(request);
  }

  if (mode === "raster-with-basemap") {
    return handleRasterWithBasemapTile(request);
  }

  return NextResponse.json({ error: "Missing or invalid tile mode" }, { status: 400 });
}
