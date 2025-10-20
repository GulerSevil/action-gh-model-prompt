import fetch from "node-fetch";

export async function callModelsApi(
  apiUrl: string,
  token: string,
  payload: Record<string, unknown>,
  timeoutMs: number,
): Promise<string> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(apiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    } as any);
    const raw = await resp.text();
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}: ${raw}`);
    }
    return raw;
  } finally {
    clearTimeout(t);
  }
}
