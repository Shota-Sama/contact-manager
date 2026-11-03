import { NextResponse } from "next/server";

const geocoderUrl = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const userAgent = process.env.NOMINATIM_USER_AGENT ?? "contact-manager/1.0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(
      `${geocoderUrl}/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        cache: "force-cache",
      },
    );

    if (!response.ok) throw new Error("Address search failed");
    const results = (await response.json()) as Array<{
      display_name?: unknown;
      lat?: unknown;
      lon?: unknown;
    }>;

    return NextResponse.json({
      results: results
        .filter(
          (item) =>
            typeof item.display_name === "string" &&
            Number.isFinite(Number(item.lat)) &&
            Number.isFinite(Number(item.lon)),
        )
        .map((item) => ({
          address: item.display_name as string,
          lat: Number(item.lat),
          lng: Number(item.lon),
        })),
    });
  } catch {
    return NextResponse.json({ error: "Unable to search addresses." }, { status: 503 });
  }
}
