/**
 * Business Program 5 — única entrada de autenticação do produto.
 * Nunca apontar comprador/vendedor para /login (console admin).
 */
import { normalizeInternalPath } from "@/lib/auth/safe-path";

export function entrarPath(next?: string | null, fallback = "/loja"): string {
  const dest = normalizeInternalPath(
    (next && next.trim()) || fallback,
    fallback.startsWith("/") ? fallback : `/${fallback}`,
  );
  return `/entrar?next=${encodeURIComponent(dest)}`;
}

/** Lê next ou redirect (legado) da query de /entrar. */
export function readEntrarNext(
  get: (key: string) => string | null,
  fallback = "/perfil",
): string {
  const raw = get("next") ?? get("redirect") ?? fallback;
  return normalizeInternalPath(raw, fallback);
}
