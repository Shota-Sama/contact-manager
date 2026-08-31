import { NextResponse } from "next/server";
import { backendError, backendFetch } from "@/lib/backend";
import { requireAuth } from "@/lib/auth";

function toContact(contact: Record<string, unknown>) {
  return { ...contact, lat: contact.latitude, lng: contact.longitude };
}

export async function GET() {
  try {
    const userId = await requireAuth();
    const response = await backendFetch(`/api/Contact/user/${encodeURIComponent(userId)}`);
    if (!response.ok) throw new Error("Backend request failed");
    const contacts = (await response.json() as Record<string, unknown>[]).map(toContact);
    return NextResponse.json({ contacts });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to load contacts." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const response = await backendFetch("/api/Contact", {
      method: "POST",
      body: JSON.stringify({
        userId,
        contact: {
          name: body.name,
          email: body.email,
          phone: body.phone,
          address: body.address,
          latitude: body.lat,
          longitude: body.lng,
        },
      }),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: await backendError(response, "Unable to create contact.") },
        { status: response.status },
      );
    }
    return NextResponse.json({ contact: toContact(await response.json()) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "Unauthorized" ? "Unauthorized" : "Unable to create contact." }, { status: error instanceof Error && error.message === "Unauthorized" ? 401 : 503 });
  }
}
