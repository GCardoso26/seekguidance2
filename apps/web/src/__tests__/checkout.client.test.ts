import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHttpClient } from "@/src/api/client";
import { createCheckoutApiClient } from "@/src/api/checkout.client";
import {
  clearCartDisplayMeta,
  clearPersistedCartId,
  getPersistedCartId,
  loadCartDisplayMeta,
  persistCartId,
  upsertCartDisplayMeta,
} from "@/src/auth/cart-storage";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CheckoutApiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    clearPersistedCartId();
    clearCartDisplayMeta();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    clearPersistedCartId();
    clearCartDisplayMeta();
  });

  it("createCart + addCartItem + startCheckout", async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(201, {
          id: "cart-1",
          status: "open",
          items: [],
          totalCents: 0,
          currency: "BRL",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          id: "cart-1",
          status: "open",
          items: [
            {
              id: "item-1",
              listingId: "listing-1",
              catalogVariantId: "v1",
              quantity: 1,
              priceSnapshotCents: 2000,
              currency: "BRL",
            },
          ],
          totalCents: 2000,
          currency: "BRL",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse(201, {
          checkoutSessionId: "chk-1",
          status: "CREATED",
          orderId: "ord-1",
          cartId: "cart-1",
        }),
      );

    const api = createCheckoutApiClient(createHttpClient());
    const cart = await api.createCart();
    expect(cart.id).toBe("cart-1");
    const withItem = await api.addCartItem(cart.id, { listingId: "listing-1", quantity: 1 });
    expect(withItem.items[0]!.priceSnapshotCents).toBe(2000);
    const session = await api.startCheckout(cart.id);
    expect(session.status).toBe("CREATED");
    expect(fetchMock.mock.calls[2]![0]).toBe("/api/v1/checkout");
  });

  it("removeCartItem", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(200, {
        id: "cart-1",
        status: "open",
        items: [],
        totalCents: 0,
        currency: "BRL",
      }),
    );
    const api = createCheckoutApiClient(createHttpClient());
    const cart = await api.removeCartItem("cart-1", "item-1");
    expect(cart.items).toHaveLength(0);
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain(
      "/api/v1/cart/cart-1/items/item-1",
    );
  });
});

describe("cart storage persistence", () => {
  beforeEach(() => {
    clearPersistedCartId();
    clearCartDisplayMeta();
  });

  it("persiste cartId e meta de display sem IDs na UI helper", () => {
    persistCartId("cart-xyz");
    expect(getPersistedCartId()).toBe("cart-xyz");
    upsertCartDisplayMeta({
      listingId: "listing-1",
      cardId: "card-1",
      cardName: "Lightning Bolt",
      storeName: "Card Shop",
      condition: "NM",
      language: "en",
    });
    const meta = loadCartDisplayMeta();
    expect(meta["listing-1"]!.cardName).toBe("Lightning Bolt");
    expect(meta["listing-1"]!.storeName).toBe("Card Shop");
  });
});
