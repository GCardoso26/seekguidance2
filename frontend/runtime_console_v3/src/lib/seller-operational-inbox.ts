import type { HeaderNotificationCategory } from "@/lib/seller-global-search-mock";
import type { OperationalActionItem } from "@/lib/seller-operational-actions";

export type InboxCategory =
  | "orders"
  | "tickets"
  | "chargebacks"
  | "alerts"
  | "system"
  | "promotions";

export type InboxItem = {
  id: string;
  category: InboxCategory;
  title: string;
  description: string;
  href: string;
  urgent: boolean;
  count?: number;
  createdAt: string;
};

const CATEGORY_MAP: Record<string, InboxCategory> = {
  new_orders: "orders",
  orders: "orders",
  tickets: "tickets",
  payments: "system",
  chargeback: "chargebacks",
  chargebacks: "chargebacks",
  alerts: "alerts",
  system: "system",
  promotions: "promotions",
};

const READ_STORAGE_KEY = "judgetcg-seller-inbox-read-v1";

export function loadInboxReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveInboxReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...ids]));
}

export function markInboxItemRead(id: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  next.add(id);
  saveInboxReadIds(next);
  return next;
}

export function markAllInboxRead(items: InboxItem[], current: Set<string>): Set<string> {
  const next = new Set(current);
  for (const item of items) next.add(item.id);
  saveInboxReadIds(next);
  return next;
}

/** Read model client-side — agrega fontes existentes sem novo contrato de API. */
export function buildOperationalInboxItems(
  categories: HeaderNotificationCategory[],
  actions: OperationalActionItem[],
): InboxItem[] {
  const now = new Date().toISOString();
  const items: InboxItem[] = [];

  for (const cat of categories) {
    items.push({
      id: `header-${cat.type}`,
      category: CATEGORY_MAP[cat.type] ?? "system",
      title: cat.label,
      description: `${cat.count} item(ns) pendente(s)`,
      href: cat.action,
      urgent: Boolean(cat.urgent),
      count: cat.count,
      createdAt: now,
    });
  }

  for (const action of actions) {
    items.push({
      id: `action-${action.id}`,
      category: action.id.includes("ticket")
        ? "tickets"
        : action.id.includes("chargeback") || action.id.includes("dispute")
          ? "chargebacks"
          : action.id.includes("payout")
            ? "system"
            : "alerts",
      title: action.title,
      description: action.description,
      href: action.href,
      urgent: action.severity === "critical",
      count: action.count,
      createdAt: now,
    });
  }

  const urgency = (i: InboxItem) => (i.urgent ? 0 : 1);
  return items.sort((a, b) => urgency(a) - urgency(b));
}

export function filterInboxByCategory(items: InboxItem[], category: InboxCategory | "all") {
  if (category === "all") return items;
  return items.filter((i) => i.category === category);
}

export const INBOX_CATEGORY_LABELS: Record<InboxCategory, string> = {
  orders: "Pedidos",
  tickets: "Tickets",
  chargebacks: "Chargebacks",
  alerts: "Alertas",
  system: "Sistema",
  promotions: "Promoções",
};
