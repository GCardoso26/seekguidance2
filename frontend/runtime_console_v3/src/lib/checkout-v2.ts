/**
 * Checkout BC V2 client (browser → Next BFF → API).
 * Enabled when NEXT_PUBLIC_CHECKOUT_V2=1.
 */
export function isCheckoutV2Enabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_CHECKOUT_V2 === "1" ||
    process.env.NEXT_PUBLIC_CHECKOUT_V2 === "true"
  );
}

const BASE = "/api/checkout-v2";

async function json<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (body as { error?: string }).error ?? `checkout_v2_http_${res.status}`;
    throw new Error(err);
  }
  return body as T;
}

export type CheckoutV2Cart = {
  id: string;
  buyerId: string;
  status: string;
  items: Array<{
    id: string;
    listingId: string;
    quantity: number;
    priceSnapshotCents: number;
    currency: string;
  }>;
};

export type CheckoutV2Session = {
  id: string;
  cartId: string;
  status: string;
  totalCents: number;
  currency: string;
  paymentIntentId: string | null;
  clientSecret: string | null;
  pix?: {
    qrCodeBase64?: string | null;
    copyPaste?: string | null;
    expiresAt?: string | null;
  } | null;
  error?: string | null;
};

export async function checkoutV2GetOrCreateCart(): Promise<CheckoutV2Cart> {
  return json(await fetch(`${BASE}/cart`, { method: "POST" }));
}

export async function checkoutV2AddItem(
  cartId: string,
  listingId: string,
  quantity = 1,
): Promise<CheckoutV2Cart> {
  return json(
    await fetch(`${BASE}/cart/${encodeURIComponent(cartId)}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, quantity }),
    }),
  );
}

export async function checkoutV2StartSession(input: {
  cartId: string;
  paymentMethod?: "card" | "pix";
  couponCode?: string;
  idempotencyKey?: string;
}): Promise<CheckoutV2Session> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  return json(
    await fetch(`${BASE}/sessions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        cartId: input.cartId,
        paymentMethod: input.paymentMethod ?? "pix",
        couponCode: input.couponCode,
        idempotencyKey: input.idempotencyKey,
      }),
    }),
  );
}

export async function checkoutV2ConfirmPayment(input: {
  sessionId: string;
  clientSecret?: string;
  simulateSuccess?: boolean;
  idempotencyKey?: string;
}): Promise<CheckoutV2Session & { confirmedReservationIds?: string[] }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (input.idempotencyKey) headers["Idempotency-Key"] = input.idempotencyKey;
  return json(
    await fetch(`${BASE}/sessions/${encodeURIComponent(input.sessionId)}/confirm-payment`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        clientSecret: input.clientSecret,
        simulateSuccess: input.simulateSuccess ?? true,
        idempotencyKey: input.idempotencyKey,
      }),
    }),
  );
}

export async function checkoutV2ExpireSession(sessionId: string): Promise<CheckoutV2Session> {
  return json(
    await fetch(`${BASE}/sessions/${encodeURIComponent(sessionId)}/expire`, {
      method: "POST",
    }),
  );
}
