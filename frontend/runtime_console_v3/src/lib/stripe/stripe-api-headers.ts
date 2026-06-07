const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function stripeApiHeaders(userId: string): Promise<Record<string, string>> {
  return {
    "Content-Type": "application/json",
    "X-Judge-User-Id": userId,
  };
}

export { API_BASE };
