import { getArchetype } from "./archetypes/index.ts";
import type { ArchetypeId } from "./archetypes/types.ts";
import { buildPersona } from "./core/builders.ts";
import type { GameSlug, InventoryLine, Persona, PersonaOrder } from "./core/types.ts";
import type { CatalogOverrides, GameCatalog } from "../catalogs/types.ts";

const PASSWORDS: Record<string, string> = {
  seller: "PersonaSeller1!",
  buyer: "PersonaBuyer1!",
  collector: "PersonaCollector1!",
  hybrid: "PersonaHybrid1!",
  admin: "PersonaAdmin1!",
};

type ComposeOpts = {
  catalog: GameCatalog;
  archetypeId: ArchetypeId;
  overrides?: CatalogOverrides;
  /** Extra fields when legacy personas need exact orders/cart */
  patch?: Partial<
    Pick<Persona, "orders" | "cart" | "listings" | "inventory" | "wishlist" | "favorites" | "email" | "displayName">
  >;
};

/**
 * Competitive Player + Lorcana Dataset → Lorcana Competitive
 * Trocar dataset não altera o comportamento do archetipo.
 */
export function composePersona(opts: ComposeOpts): Persona {
  const { catalog, archetypeId, overrides, patch } = opts;
  const arch = getArchetype(archetypeId);
  const game = catalog.game;
  const id =
    overrides?.personaIds?.[archetypeId as keyof NonNullable<CatalogOverrides["personaIds"]>] ??
    `${game}-${archetypeId}`;

  const emailRole =
    arch.role === "seller" || arch.role === "hybrid"
      ? "seller"
      : arch.role === "collector"
        ? "collector"
        : "buyer";
  const email = patch?.email ?? `${emailRole}-alpha-${game === "dragonball" ? "dbfw" : game}@judgetcg.test`;

  const inventory = takeInventory(catalog, arch.inventoryTarget);
  const wishlist =
    arch.role === "collector"
      ? catalog.collectorTargets.wishlist.slice(0, arch.wishlistSize)
      : catalog.competitiveTargets.slice(0, arch.wishlistSize);
  const favorites =
    arch.role === "collector" || arch.favoritesSize > 0
      ? catalog.collectorTargets.favorites.slice(0, Math.max(arch.favoritesSize, 0))
      : [];

  const shop =
    arch.defaultPlan != null
      ? {
          id: `shop-${id}`,
          slug:
            overrides?.shopSlugs?.[archetypeId as "seller-large" | "seller-small"] ??
            `${game}-${archetypeId}`,
          name: patch?.displayName ?? `${catalog.displayName} ${arch.label}`,
          plan: arch.defaultPlan,
          shopEnabled: catalog.datasetReady,
        }
      : null;

  const listings = inventory.length ? inventory.slice(0, Math.max(1, Math.ceil(inventory.length / 2))) : [];
  const cart =
    arch.role === "buyer" || arch.role === "hybrid"
      ? seedCart(catalog, arch.profile.averageOrderValueCents)
      : [];

  const orders: PersonaOrder[] =
    arch.role === "seller" && inventory.length
      ? [
          {
            id: `ord-${id}-1`,
            status: "delivered",
            totalCents: inventory[0]?.priceCents ?? arch.profile.averageOrderValueCents,
            itemNames: [inventory[0]?.cardName ?? "sample"],
          },
        ]
      : [];

  const displayName =
    patch?.displayName ??
    (catalog.datasetReady
      ? `${shortGameLabel(game)} ${arch.label.replace(" Player", "").replace("Seller ", "")}`.trim()
      : `${shortGameLabel(game)} ${arch.label} (scaffold)`);

  return buildPersona({
    id,
    email,
    password: PASSWORDS[arch.role] ?? PASSWORDS.buyer,
    displayName,
    game,
    role: arch.role,
    behavior: arch.behavior,
    archetypeId,
    profile: { ...arch.profile },
    shop,
    inventory: patch?.inventory ?? inventory,
    wishlist: patch?.wishlist ?? wishlist,
    favorites: patch?.favorites ?? favorites,
    orders: patch?.orders ?? orders,
    cart: patch?.cart ?? cart,
    listings: patch?.listings ?? listings,
  });
}

/**
 * Pack padrão por jogo: seller-large | competitive | collector
 * (MTG: + seller-small; Riftbound/Naruto: seller-small em vez de large)
 */
export function composeDefaultPack(
  catalog: GameCatalog,
  archetypeIds: ArchetypeId[],
  overrides?: CatalogOverrides,
  patches?: Partial<Record<ArchetypeId, ComposeOpts["patch"]>>,
): Persona[] {
  return archetypeIds.map((archetypeId) =>
    composePersona({
      catalog,
      archetypeId,
      overrides,
      patch: patches?.[archetypeId],
    }),
  );
}

function takeInventory(catalog: GameCatalog, target: number): InventoryLine[] {
  if (target <= 0 || !catalog.staples.length) return [];
  return catalog.staples.slice(0, target).map((line) => ({ ...line }));
}

function seedCart(catalog: GameCatalog, _aov: number): Array<{ cardName: string; quantity: number }> {
  const name = catalog.competitiveTargets[0] ?? catalog.staples[0]?.cardName;
  if (!name) return [];
  return [{ cardName: name, quantity: 1 }];
}

function shortGameLabel(game: GameSlug): string {
  const map: Record<GameSlug, string> = {
    lorcana: "Lorcana",
    mtg: "MTG",
    pokemon: "Pokémon",
    onepiece: "One Piece",
    digimon: "Digimon",
    dragonball: "Dragon Ball",
    riftbound: "Riftbound",
    naruto: "Naruto",
  };
  return map[game];
}
