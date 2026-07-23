/**
 * Notification Center V2 — group, priority, deep links, action buttons.
 * Fed by Domain Events via existing notifications BFF (no polling inventado).
 */

import type { AppNotification } from "@/types/post";

export type NotificationPriority = "critical" | "high" | "normal" | "low";

export type NotificationGroupId =
  | "price"
  | "inventory"
  | "orders"
  | "collection"
  | "deck"
  | "social"
  | "tournament"
  | "expansion"
  | "marketplace"
  | "other";

export type NotificationAction = {
  label: string;
  href: string;
};

const TYPE_GROUP: Record<string, NotificationGroupId> = {
  price_alert: "price",
  order_update: "orders",
  order_shipped: "orders",
  order_delivered: "orders",
  tournament_reminder: "tournament",
  tournament_result: "tournament",
  xp_earned: "other",
  badge_unlocked: "other",
  achievement_unlocked: "other",
  message: "social",
  follow: "social",
  comment: "social",
  deck_liked: "deck",
  deck_updated: "deck",
  stock: "inventory",
  expansion: "expansion",
  wishlist: "marketplace",
  wishlist_available: "marketplace",
  collection_valued: "collection",
  meta_shift: "marketplace",
  editorial: "other",
  better_offer: "marketplace",
};

const TYPE_PRIORITY: Record<string, NotificationPriority> = {
  order_update: "critical",
  order_shipped: "critical",
  order_delivered: "high",
  price_alert: "high",
  tournament_reminder: "high",
  stock: "high",
  wishlist: "high",
  wishlist_available: "high",
  better_offer: "high",
  follow: "normal",
  comment: "normal",
  deck_liked: "normal",
  deck_updated: "normal",
  expansion: "normal",
  tournament_result: "normal",
  collection_valued: "normal",
  meta_shift: "normal",
  editorial: "low",
  xp_earned: "low",
  badge_unlocked: "low",
  achievement_unlocked: "low",
};

export function groupForNotification(n: AppNotification): NotificationGroupId {
  return TYPE_GROUP[n.type] ?? "other";
}

export function priorityForNotification(n: AppNotification): NotificationPriority {
  return TYPE_PRIORITY[n.type] ?? "normal";
}

export function actionForNotification(n: AppNotification): NotificationAction | null {
  const link = (n as { link?: string; href?: string; actionUrl?: string }).link
    || (n as { href?: string }).href
    || (n as { actionUrl?: string }).actionUrl;
  if (link) return { label: "Abrir", href: link };

  switch (n.type) {
    case "price_alert":
    case "better_offer":
      return { label: "Ver oferta", href: "/wishlist" };
    case "order_update":
    case "order_shipped":
    case "order_delivered":
      return { label: "Ver pedido", href: "/marketplace/orders" };
    case "tournament_reminder":
    case "tournament_result":
      return { label: "Tournament Hub", href: "/torneio" };
    case "message":
      return { label: "Mensagens", href: "/social/messages" };
    case "xp_earned":
    case "badge_unlocked":
    case "achievement_unlocked":
      return { label: "Conquistas", href: "/perfil/conquistas" };
    case "collection_valued":
      return { label: "Coleção", href: "/colecao" };
    case "deck_liked":
    case "deck_updated":
      return { label: "Decks", href: "/decks" };
    case "wishlist":
    case "wishlist_available":
      return { label: "Wishlist", href: "/wishlist" };
    case "stock":
      return { label: "Marketplace", href: "/loja" };
    case "expansion":
      return { label: "Expansões", href: "/editorial" };
    case "meta_shift":
      return { label: "Meta", href: "/editorial" };
    case "editorial":
      return { label: "Editorial", href: "/editorial" };
    case "follow":
    case "comment":
      return { label: "Social", href: "/social" };
    default:
      return { label: "Abrir", href: "/notifications" };
  }
}

export type NotificationGroup = {
  id: NotificationGroupId;
  label: string;
  items: AppNotification[];
  unread: number;
};

const GROUP_LABELS: Record<NotificationGroupId, string> = {
  price: "Preços",
  inventory: "Estoque",
  orders: "Pedidos",
  collection: "Coleção",
  deck: "Decks",
  social: "Social",
  tournament: "Torneios",
  expansion: "Expansões",
  marketplace: "Marketplace",
  other: "Outros",
};

export function groupNotifications(items: AppNotification[]): NotificationGroup[] {
  const map = new Map<NotificationGroupId, AppNotification[]>();
  for (const n of items) {
    const g = groupForNotification(n);
    const list = map.get(g) ?? [];
    list.push(n);
    map.set(g, list);
  }
  return Array.from(map.entries()).map(([id, groupItems]) => ({
    id,
    label: GROUP_LABELS[id],
    items: groupItems,
    unread: groupItems.filter((n) => !n.readAt).length,
  }));
}

export const NOTIFICATION_CENTER_COPY = [
  "Preço caiu",
  "Carta voltou ao estoque",
  "Nova expansão",
  "Novo torneio",
  "Pedido enviado",
  "Pedido entregue",
  "Coleção valorizou",
  "Deck atualizado",
  "Novo comentário",
  "Novo seguidor",
  "Wishlist disponível",
  "Marketplace encontrou oferta melhor",
] as const;
