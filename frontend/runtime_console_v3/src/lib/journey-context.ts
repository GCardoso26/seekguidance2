/**
 * Preserves game / return context across modules (session only).
 * Avoids feeling of "leaving" a portal when entering checkout/wishlist.
 */

const KEY = "judgetcg:journey-context";

export type JourneyContext = {
  gameSlug?: string;
  cardId?: string;
  returnPath?: string;
  source?: string;
  updatedAt: number;
};

export function saveJourneyContext(partial: Omit<JourneyContext, "updatedAt">): void {
  if (typeof globalThis === "undefined") return;
  const storage = (globalThis as { sessionStorage?: Storage }).sessionStorage;
  if (!storage) return;
  try {
    const prev = readJourneyContext();
    const next: JourneyContext = {
      ...prev,
      ...partial,
      updatedAt: Date.now(),
    };
    storage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
}

export function readJourneyContext(): JourneyContext | null {
  if (typeof globalThis === "undefined") return null;
  const storage = (globalThis as { sessionStorage?: Storage }).sessionStorage;
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JourneyContext;
  } catch {
    return null;
  }
}

export function continueShoppingHref(fallback = "/loja"): string {
  const ctx = readJourneyContext();
  if (ctx?.gameSlug) return `/${ctx.gameSlug}`;
  if (ctx?.returnPath?.startsWith("/")) return ctx.returnPath;
  return fallback;
}

export function cardReturnHref(cardId?: string, fallback = "/loja"): string {
  const ctx = readJourneyContext();
  if (ctx?.gameSlug && (cardId || ctx.cardId)) {
    return `/${ctx.gameSlug}/cards/${encodeURIComponent(cardId || ctx.cardId!)}`;
  }
  if (cardId) return `/cards/${encodeURIComponent(cardId)}`;
  return continueShoppingHref(fallback);
}
