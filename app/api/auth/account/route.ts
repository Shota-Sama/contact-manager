import { NextResponse } from "next/server";
import { backendError, backendFetch } from "@/lib/backend";
import { clearSessionCookie, requireAuth } from "@/lib/auth";

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();
    const body = await request.json();
    const response = await backendFetch(`/api/Auth/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      body: JSON.stringify({ currentPassword: body.currentPassword }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: await backendError(response, "Unable to delete your account.") },
        { status: response.status },
      );
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    const unauthorized = error instanceof Error && error.message === "Unauthorized";
    return NextResponse.json(
      { error: unauthorized ? "Unauthorized" : "Unable to delete your account." },
      { status: unauthorized ? 401 : 503 },
    );
  }
}
