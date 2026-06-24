/** Base URL do backend FastAPI (Render em produção, localhost em dev). */
export const API_PROXY_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

export const API_FETCH_TIMEOUT_MS = 8_000;

export async function fetchApiWithTimeout(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<Response> {
  const { next, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);

  try {
    return await fetch(`${API_PROXY_BASE}${path}`, {
      ...fetchInit,
      signal: controller.signal,
      next,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
