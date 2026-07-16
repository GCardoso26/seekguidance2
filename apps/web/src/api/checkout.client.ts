import type { HttpClient } from "@/src/api/client";
import type { CartResponse, CheckoutResponse } from "@/src/types/api";

export interface CheckoutApiClient {
  createCart(): Promise<CartResponse>;
  getCart(cartId: string): Promise<CartResponse>;
  addCartItem(
    cartId: string,
    input: { listingId: string; quantity?: number },
  ): Promise<CartResponse>;
  removeCartItem(cartId: string, itemId: string): Promise<CartResponse>;
  startCheckout(cartId: string): Promise<CheckoutResponse>;
  payCheckout(checkoutSessionId: string): Promise<unknown>;
}

export function createCheckoutApiClient(http: HttpClient): CheckoutApiClient {
  return {
    createCart() {
      return http.post<CartResponse>("/api/v1/cart", {});
    },

    getCart(cartId) {
      return http.get<CartResponse>(`/api/v1/cart/${encodeURIComponent(cartId)}`);
    },

    addCartItem(cartId, input) {
      return http.post<CartResponse>(
        `/api/v1/cart/${encodeURIComponent(cartId)}/items`,
        input,
      );
    },

    removeCartItem(cartId, itemId) {
      return http.delete<CartResponse>(
        `/api/v1/cart/${encodeURIComponent(cartId)}/items/${encodeURIComponent(itemId)}`,
      );
    },

    startCheckout(cartId) {
      return http.post<CheckoutResponse>("/api/v1/checkout", { cartId });
    },

    payCheckout(checkoutSessionId) {
      return http.post(
        `/api/v1/checkout/${encodeURIComponent(checkoutSessionId)}/pay`,
        {},
      );
    },
  };
}
