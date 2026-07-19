import type { InventoryLine, Persona, PersonaOrder, PersonaShop } from "./types.ts";

type BuildOpts = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  game: Persona["game"];
  role: Persona["role"];
  behavior: Persona["behavior"];
  shop?: PersonaShop | null;
  inventory?: InventoryLine[];
  wishlist?: string[];
  favorites?: string[];
  orders?: PersonaOrder[];
  cart?: Persona["cart"];
  listings?: InventoryLine[];
};

/** Builder determinístico — sem aleatoriedade. */
export function buildPersona(opts: BuildOpts): Persona {
  return {
    id: opts.id,
    email: opts.email,
    password: opts.password,
    displayName: opts.displayName,
    game: opts.game,
    role: opts.role,
    behavior: opts.behavior,
    shop: opts.shop ?? null,
    inventory: opts.inventory ?? [],
    wishlist: opts.wishlist ?? [],
    favorites: opts.favorites ?? [],
    orders: opts.orders ?? [],
    cart: opts.cart ?? [],
    listings: opts.listings ?? opts.inventory ?? [],
  };
}

export function inv(
  cardName: string,
  quantity: number,
  extra: Partial<InventoryLine> = {},
): InventoryLine {
  return { cardName, quantity, condition: "NM", language: "en", ...extra };
}
