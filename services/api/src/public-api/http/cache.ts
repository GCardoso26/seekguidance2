import { createHash } from "node:crypto";

export interface CacheHeaders {
  etag: string;
  cacheControl: string;
  lastModified: string;
}

export function buildCacheHeaders(
  body: string,
  lastModifiedIso: string | null,
  maxAgeSec = 30,
): CacheHeaders {
  const etag = `"${createHash("sha256").update(body).digest("hex").slice(0, 32)}"`;
  const lastModified = lastModifiedIso
    ? new Date(lastModifiedIso).toUTCString()
    : new Date().toUTCString();
  return {
    etag,
    cacheControl: `public, max-age=${maxAgeSec}, stale-while-revalidate=${maxAgeSec * 2}`,
    lastModified,
  };
}

export function notModified(
  reqEtag: string | undefined,
  reqIms: string | undefined,
  headers: CacheHeaders,
): boolean {
  if (reqEtag && reqEtag === headers.etag) return true;
  if (reqIms && Date.parse(reqIms) >= Date.parse(headers.lastModified)) return true;
  return false;
}
