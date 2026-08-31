import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend";
import { getSessionUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const response = await backendFetch(`/api/Auth/${encodeURIComponent(userId)}`);
    if (!response.ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await response.json();
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Account service unavailable" }, { status: 503 });
  }
}
