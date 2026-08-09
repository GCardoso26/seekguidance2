export type StoreEventRow = {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  game: string | null;
  format: string | null;
  capacity: number | null;
  startsAt: string | null;
  venue: string | null;
  status: string;
  bannerUrl: string | null;
  storeName: string | null;
  storeSlug: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressCep: string | null;
  contactPhone: string | null;
  ticketsRemaining: number | null;
  ticketsCapacity: number | null;
  ticketsSold: number | null;
};

export function normalizeStoreEvent(row: Record<string, unknown>): StoreEventRow {
  const policies = (row.policies ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    storeId: String(row.store_id ?? ""),
    name: String(row.name ?? ""),
    description: row.description ? String(row.description) : null,
    game: row.game ? String(row.game) : null,
    format: row.format ? String(row.format) : null,
    capacity: row.capacity != null ? Number(row.capacity) : null,
    startsAt: row.starts_at ? String(row.starts_at) : null,
    venue: row.venue ? String(row.venue) : null,
    status: String(row.status ?? "draft"),
    bannerUrl: row.banner_url ? String(row.banner_url) : row.image_url ? String(row.image_url) : null,
    storeName: row.store_name ? String(row.store_name) : null,
    storeSlug: row.store_slug ? String(row.store_slug) : null,
    addressCity: policies.address_city
      ? String(policies.address_city)
      : row.store_city
        ? String(row.store_city)
        : null,
    addressState: policies.address_state
      ? String(policies.address_state)
      : row.store_state
        ? String(row.store_state)
        : null,
    addressCep: policies.address_cep
      ? String(policies.address_cep)
      : row.store_postal_code
        ? String(row.store_postal_code)
        : null,
    contactPhone: policies.contact_phone ? String(policies.contact_phone) : null,
    ticketsRemaining: row.tickets_remaining != null ? Number(row.tickets_remaining) : null,
    ticketsCapacity:
      row.tickets_capacity != null
        ? Number(row.tickets_capacity)
        : row.capacity != null
          ? Number(row.capacity)
          : null,
    ticketsSold: row.tickets_sold != null ? Number(row.tickets_sold) : null,
  };
}
