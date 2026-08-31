import { NextResponse } from "next/server";
import { backendError, backendFetch } from "@/lib/backend";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await backendFetch("/api/Auth/signup", {
      method: "POST",
      body: JSON.stringify({ name: body.name, email: body.email, password: body.password }),
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: await backendError(response, "Unable to create account.") },
        { status: response.status },
      );
    }

    const user = await response.json();
    await setSessionCookie(await createSessionToken(user.id));
    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service." }, { status: 503 });
  }
}
