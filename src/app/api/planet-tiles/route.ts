import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get query parameters from the request URL
  const searchParams = request.nextUrl.searchParams;
  const z = searchParams.get("z");
  const x = searchParams.get("x");
  const y = searchParams.get("y");
  const date = searchParams.get("date");

  if (!z || !x || !y || !date) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Construct the Planet API URL
    const planetUrl = `https://tiles3.planet.com/basemaps/v1/planet-tiles/planet_medres_visual_${date}_mosaic/gmap/${z}/${x}/${y}.png?api_key=${process.env.NICFI_API_KEY}`;

    // Fetch the image from Planet
    const response = await fetch(planetUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from Planet API" },
        { status: response.status }
      );
    }

    // Get the image data
    const imageData = await response.arrayBuffer();

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying Planet API request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}