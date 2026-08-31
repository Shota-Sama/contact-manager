const backendUrl = process.env.CONTACT_MANAGER_API_URL ?? "http://127.0.0.1:5197";

export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = `${backendUrl}${path}`;
  return fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  }).catch((error) => {
    console.error(`Backend request failed: ${url}`, error);
    throw error;
  });
}

export async function backendError(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    return typeof body.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}
