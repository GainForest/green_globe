import { getRawSatelliteTileUrl } from "@/config/map";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const TILE_SIZE = 256;
const TILE_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

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
): Promise<Buffer | null> => {
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

  return Buffer.from(await response.arrayBuffer());
};

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
    return imageResponse(tile);
  }

  const scale = 2 ** sourceZoomOffset;
  const sourceZ = z + sourceZoomOffset;
  const childTiles = await Promise.all(
    Array.from({ length: scale * scale }, async (_, index) => {
      const dx = index % scale;
      const dy = Math.floor(index / scale);
      const buffer = await fetchSatelliteTile(x * scale + dx, y * scale + dy, sourceZ);

      if (!buffer) return null;

      return {
        input: buffer,
        left: dx * TILE_SIZE,
        top: dy * TILE_SIZE,
      };
    }),
  );
  const composites = childTiles.filter(
    (tile): tile is { input: Buffer; left: number; top: number } => Boolean(tile),
  );

  if (!composites.length) {
    const fallbackTile = await fetchSatelliteTile(x, y, z);
    if (!fallbackTile) {
      return NextResponse.json({ error: "Tile unavailable" }, { status: 502 });
    }
    return imageResponse(fallbackTile);
  }

  const image = await sharp({
    create: {
      width: TILE_SIZE * scale,
      height: TILE_SIZE * scale,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer();

  return imageResponse(image);
}
