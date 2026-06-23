/** Decodifica payload do token runtime (payload.sig) ou JWT padrão (header.payload.sig). */

export type RuntimeTokenPayload = {
  role?: string;
  username?: string;
  sub?: string;
  tenant_id?: string;
  email?: string;
};

export function decodeRuntimeTokenPayload(token: string): RuntimeTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const encoded = parts.length >= 3 ? parts[1]! : parts[0]!;
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (encoded.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as RuntimeTokenPayload;
  } catch {
    return null;
  }
}
