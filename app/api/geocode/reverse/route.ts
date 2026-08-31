import { NextResponse } from "next/server";

const geocoderUrl = process.env.NOMINATIM_BASE_URL ?? "https://nominatim.openstreetmap.org";
const userAgent = process.env.NOMINATIM_USER_AGENT ?? "contact-manager/1.0";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: "A valid map location is required." }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${geocoderUrl}/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": userAgent,
        },
        cache: "force-cache",
      },
    );

    if (!response.ok) throw new Error("Reverse geocoding failed");
    const result = (await response.json()) as { display_name?: unknown };
    return NextResponse.json({
      address: typeof result.display_name === "string" ? result.display_name : "",
    });
  } catch {
    return NextResponse.json({ error: "Unable to look up this address." }, { status: 503 });
  }
}
