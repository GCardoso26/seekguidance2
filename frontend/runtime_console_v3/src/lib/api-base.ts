export const PUBLIC_API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_PROXY_TARGET || ""
).replace(/\/$/, "");
