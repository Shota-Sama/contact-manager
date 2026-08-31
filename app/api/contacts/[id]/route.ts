import { NextResponse } from "next/server";
import { backendError, backendFetch } from "@/lib/backend";
import { requireAuth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };
const toContact = (contact: Record<string, unknown>) => ({ ...contact, lat: contact.latitude, lng: contact.longitude });

export async function GET(_request: Request, context: RouteContext) {
  try {
    const userId = await requireAuth();
    const { id } = await context.params;
    const response = await backendFetch(`/api/Contact/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`);
    if (response.status === 404) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    if (!response.ok) throw new Error();
    return NextResponse.json({ contact: toContact(await response.json()) });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to load contact." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const userId = await requireAuth();
    const { id } = await context.params;
    const body = await request.json();
    const response = await backendFetch(`/api/Contact/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ userId, contact: { name: body.name, email: body.email, phone: body.phone, address: body.address, latitude: body.lat, longitude: body.lng } }),
    });
    if (!response.ok) return NextResponse.json({ error: await backendError(response, "Unable to update contact.") }, { status: response.status });
    return NextResponse.json({ contact: toContact(await response.json()) });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to update contact." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const userId = await requireAuth();
    const { id } = await context.params;
    const response = await backendFetch(`/api/Contact/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
    if (response.status === 404) return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    if (!response.ok) throw new Error();
    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to delete contact." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}
