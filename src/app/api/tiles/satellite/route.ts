import { getRawSatelliteTileUrl } from "@/config/map";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TILE_SIZE = 256;
const TILE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

type ImageTile = {
  buffer: Buffer;
  contentType: string;
};

const parseTileNumber = (
  request: NextRequest,
  name: string,
): number | null => {
  const rawValue = request.nextUrl.searchParams.get(name);
  if (rawValue === null) return null;

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 0 ? value : null;
};

const fetchSatelliteTile = async (
  x: number,
  y: number,
  z: number,
): Promise<ImageTile | null> => {
  const response = await fetch(getRawSatelliteTileUrl(x, y, z), {
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${images}</svg>`;

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
}
