"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getApiClients } from "@/src/api";
import { ApiError } from "@/src/api/client";
import { useAuth } from "@/src/auth/auth-provider";
import {
  clearCartDisplayMeta,
  clearPersistedCartId,
  getPersistedCartId,
  loadCartDisplayMeta,
  persistCartId,
  upsertCartDisplayMeta,
} from "@/src/auth/cart-storage";
import { Analytics } from "@/src/analytics/events";
import type {
  CartItemDisplayMeta,
  CartResponse,
  CheckoutResponse,
} from "@/src/types/api";

interface CartContextValue {
  cart: CartResponse | null;
  displayMeta: Record<string, CartItemDisplayMeta>;
  loading: boolean;
  error: string | null;
  itemCount: number;
  ensureCart: () => Promise<CartResponse>;
  addOffer: (meta: CartItemDisplayMeta, quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  setQuantity: (itemId: string, listingId: string, quantity: number) => Promise<void>;
  refreshCart: () => Promise<void>;
  startCheckout: () => Promise<CheckoutResponse>;
  clearLocalCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { state, user } = useAuth();
  const { checkoutApi } = getApiClients();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [displayMeta, setDisplayMeta] = useState<Record<string, CartItemDisplayMeta>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncMeta = useCallback(() => {
    setDisplayMeta(loadCartDisplayMeta());
  }, []);

  const refreshCart = useCallback(async () => {
    const cartId = getPersistedCartId();
    if (!cartId) {
      setCart(null);
      return;
    }
    try {
      const next = await checkoutApi.getCart(cartId);
      if (next.status !== "open") {
        clearPersistedCartId();
        setCart(null);
        return;
      }
      setCart(next);
      persistCartId(next.id);
      syncMeta();
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        clearPersistedCartId();
        setCart(null);
        return;
      }
      throw err;
    }
  }, [checkoutApi, syncMeta]);

  useEffect(() => {
    if (state !== "authenticated" || !user) {
      setCart(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await refreshCart();
      } catch {
        if (!cancelled) setError("cart_load_failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, user, refreshCart]);

  const ensureCart = useCallback(async () => {
    if (cart?.status === "open") return cart;
    const created = await checkoutApi.createCart();
    persistCartId(created.id);
    setCart(created);
    return created;
  }, [cart, checkoutApi]);

  const addOffer = useCallback(
    async (meta: CartItemDisplayMeta, quantity = 1) => {
      setLoading(true);
      setError(null);
      try {
        const open = await ensureCart();
        const next = await checkoutApi.addCartItem(open.id, {
          listingId: meta.listingId,
          quantity,
        });
        upsertCartDisplayMeta(meta);
        setCart(next);
        syncMeta();
        Analytics.track("buyer_add_to_cart", {
          listingId: meta.listingId,
          cardId: meta.cardId,
          quantity,
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.code : "add_to_cart_failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [checkoutApi, ensureCart, syncMeta],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!cart) return;
      setLoading(true);
      setError(null);
      try {
        const next = await checkoutApi.removeCartItem(cart.id, itemId);
        setCart(next);
      } catch (err) {
        setError(err instanceof ApiError ? err.code : "remove_failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart, checkoutApi],
  );

  /**
   * Absolute quantity via remove + add (API has no PATCH qty).
   * Snapshot is re-taken on add — acceptable for MVP; original frozen snapshot
   * is preserved when only increasing via addCartItem merge.
   */
  const setQuantity = useCallback(
    async (itemId: string, listingId: string, quantity: number) => {
      if (!cart) return;
      setLoading(true);
      setError(null);
      try {
        if (quantity <= 0) {
          const next = await checkoutApi.removeCartItem(cart.id, itemId);
          setCart(next);
          return;
        }
        const current = cart.items.find((i) => i.id === itemId);
        if (!current) return;
        if (quantity === current.quantity) return;

        if (quantity > current.quantity) {
          const next = await checkoutApi.addCartItem(cart.id, {
            listingId,
            quantity: quantity - current.quantity,
          });
          setCart(next);
          return;
        }

        // Decrease: remove line then re-add with target qty (new snapshot from listing)
        await checkoutApi.removeCartItem(cart.id, itemId);
        const next = await checkoutApi.addCartItem(cart.id, { listingId, quantity });
        setCart(next);
      } catch (err) {
        setError(err instanceof ApiError ? err.code : "qty_failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart, checkoutApi],
  );

  const startCheckout = useCallback(async () => {
    if (!cart) throw new Error("cart_empty");
    setLoading(true);
    setError(null);
    try {
      const session = await checkoutApi.startCheckout(cart.id);
      Analytics.track("buyer_checkout_started", {
        checkoutSessionId: session.checkoutSessionId,
        cartId: cart.id,
      });
      clearPersistedCartId();
      clearCartDisplayMeta();
      setCart(null);
      setDisplayMeta({});
      return session;
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "checkout_failed");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cart, checkoutApi]);

  const clearLocalCart = useCallback(() => {
    clearPersistedCartId();
    clearCartDisplayMeta();
    setCart(null);
    setDisplayMeta({});
  }, []);

  const itemCount = useMemo(
    () => cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0,
    [cart],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      displayMeta,
      loading,
      error,
      itemCount,
      ensureCart,
      addOffer,
      removeItem,
      setQuantity,
      refreshCart,
      startCheckout,
      clearLocalCart,
    }),
    [
      cart,
      displayMeta,
      loading,
      error,
      itemCount,
      ensureCart,
      addOffer,
      removeItem,
      setQuantity,
      refreshCart,
      startCheckout,
      clearLocalCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
