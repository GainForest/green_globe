import { getRawSatelliteTileUrl } from "@/config/map";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TILE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^0\./,
];

const isPrivateHost = (hostname: string): boolean =>
  PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(hostname));

const isAllowedStorageUrl = (url: URL): boolean => {
  if (url.protocol !== "https:" || isPrivateHost(url.hostname)) return false;

  const storageOrigin = process.env.NEXT_PUBLIC_AWS_STORAGE;
  const storageHostname = storageOrigin
    ? new URL(storageOrigin).hostname
    : null;

  return url.hostname === storageHostname;
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
    return isAllowedStorageUrl(new URL(nestedSourceUrl));
  } catch {
    return false;
  }
};

const isAllowedRemoteTileUrl = (url: URL): boolean =>
  isAllowedStorageUrl(url) || isAllowedTitilerTileUrl(url);

const parseTileNumber = (
  request: NextRequest,
  name: string,
): number | null => {
  const rawValue = request.nextUrl.searchParams.get(name);
  if (rawValue === null) return null;

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

const fetchImageBuffer = async (url: string): Promise<{
  buffer: Buffer;
  contentType: string;
} | null> => {
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

const toDataUri = ({ buffer, contentType }: {
  buffer: Buffer;
  contentType: string;
}) => `data:${contentType};base64,${buffer.toString("base64")}`;

const imageResponse = (buffer: Buffer, contentType = "image/png") => {
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

const svgCompositeResponse = (
  satelliteTile: { buffer: Buffer; contentType: string },
  rasterTile: { buffer: Buffer; contentType: string },
) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><image href="${toDataUri(satelliteTile)}" width="256" height="256"/><image href="${toDataUri(rasterTile)}" width="256" height="256"/></svg>`;

  return new NextResponse(svg, {
    headers: {
      "Cache-Control": TILE_CACHE_CONTROL,
      "Content-Type": "image/svg+xml",
    },
  });
};

export async function GET(request: NextRequest) {
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

  const satelliteTile = await fetchImageBuffer(getRawSatelliteTileUrl(x, y, z));
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
}
