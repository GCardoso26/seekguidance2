/** Valida paths internos — bloqueia open redirect (//, :, URLs absolutas). */

export function isSafeInternalPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;
  const trimmed = path.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (trimmed.includes(":") || trimmed.includes("\\")) return false;
  try {
    const url = new URL(trimmed, "http://local.invalid");
    if (url.origin !== "http://local.invalid") return false;
    if (url.username || url.password) return false;
  } catch {
    return false;
  }
  return true;
}

export function normalizeInternalPath(path: string, fallback = "/judge"): string {
  const trimmed = path.trim();
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  if (!isSafeInternalPath(withSlash)) return fallback;
  return withSlash;
}
