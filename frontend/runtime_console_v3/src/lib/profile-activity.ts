/**
 * Activity Feed — estrutura consumindo Domain Events existentes via APIs públicas.
 * Não cria novo domínio.
 */

export type ActivityKind =
  | "purchase"
  | "collection_update"
  | "deck_update"
  | "collection_value"
  | "deck_publish"
  | "wishlist_price_drop"
  | "missing_purchase"
  | "sale"
  | "achievement"
  | "generic";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  href?: string;
  occurredAt: string;
  meta?: Record<string, unknown>;
};

export type ActivityFeedProvider = {
  /** Monta feed a partir de projeções públicas já disponíveis no FE. */
  buildFromProjections(input: {
    recentOrders?: Array<{ id: string; store_name?: string | null; created_at?: string; total_cents?: number }>;
    recentDecks?: Array<{ id: string; name: string; updatedAt?: string; isPublic?: boolean }>;
    collectionUpdatedAt?: string | null;
    valueChangeHint?: string | null;
    wishlistAlerts?: Array<{ id: string; title?: string; triggeredAt?: string }>;
    achievementsUnlocked?: Array<{ id: string; title: string }>;
  }): ActivityItem[];
};

function isoOrNow(value?: string | null): string {
  if (value && !Number.isNaN(Date.parse(value))) return value;
  return new Date().toISOString();
}

export const defaultActivityFeedProvider: ActivityFeedProvider = {
  buildFromProjections(input) {
    const items: ActivityItem[] = [];

    for (const order of input.recentOrders ?? []) {
      items.push({
        id: `order-${order.id}`,
        kind: "purchase",
        title: order.store_name
          ? `Comprou em ${order.store_name}`
          : "Novo pedido no Marketplace",
        href: `/marketplace/orders/${order.id}`,
        occurredAt: isoOrNow(order.created_at),
        meta: { total_cents: order.total_cents },
      });
    }

    for (const deck of input.recentDecks ?? []) {
      items.push({
        id: `deck-${deck.id}-${deck.updatedAt ?? "x"}`,
        kind: deck.isPublic ? "deck_publish" : "deck_update",
        title: deck.isPublic
          ? `Publicou deck ${deck.name}`
          : `Deck atualizado: ${deck.name}`,
        href: `/decks/${deck.id}`,
        occurredAt: isoOrNow(deck.updatedAt),
      });
    }

    if (input.collectionUpdatedAt) {
      items.push({
        id: `collection-${input.collectionUpdatedAt}`,
        kind: "collection_update",
        title: "Atualizou coleção",
        href: "/colecao",
        occurredAt: isoOrNow(input.collectionUpdatedAt),
      });
    }

    if (input.valueChangeHint) {
      items.push({
        id: `value-${input.collectionUpdatedAt ?? "hint"}`,
        kind: "collection_value",
        title: input.valueChangeHint,
        href: "/colecao",
        occurredAt: isoOrNow(input.collectionUpdatedAt),
      });
    }

    for (const alert of input.wishlistAlerts ?? []) {
      items.push({
        id: `wish-${alert.id}`,
        kind: "wishlist_price_drop",
        title: alert.title ?? "Preço caiu em carta da wishlist",
        href: "/perfil/wishlist",
        occurredAt: isoOrNow(alert.triggeredAt),
      });
    }

    for (const ach of input.achievementsUnlocked ?? []) {
      items.push({
        id: `ach-${ach.id}`,
        kind: "achievement",
        title: `Conquista: ${ach.title}`,
        href: "/perfil/conquistas",
        occurredAt: isoOrNow(null),
      });
    }

    return items.sort(
      (a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt),
    );
  },
};
