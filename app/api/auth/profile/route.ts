import { NextResponse } from "next/server";
import { backendError, backendFetch } from "@/lib/backend";
import { requireAuth } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const response = await backendFetch(`/api/Auth/${encodeURIComponent(userId)}`, {
      method: "PUT",
      body: JSON.stringify({
        name: body.name,
        email: body.email,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: await backendError(response, "Unable to update your profile.") },
        { status: response.status },
      );
    }

    const user = await response.json();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to update your profile." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}
