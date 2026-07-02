export type PaymentMethodId = "credit_card" | "pix" | "boleto" | "cash";

export type ShippingRule = {
  region: string;
  min_value: number;
  max_value: number | null;
  price: number;
  free_above: number | null;
};

export type SellerPaymentSettings = {
  pix_key: string;
  pix_key_type: string;
  stripe_account_id: string | null;
  accepted_methods: PaymentMethodId[];
};

export type SellerShippingSettings = {
  default_price: number;
  rules: ShippingRule[];
};

export type SellerApiSettings = {
  api_key_prefix: string | null;
  webhook_url: string;
};

export type SellerStoreSettings = {
  name: string;
  description: string;
  slug: string;
};

export type SellerSettings = {
  store: SellerStoreSettings;
  payments: SellerPaymentSettings;
  shipping: SellerShippingSettings;
  api: SellerApiSettings;
};

export function normalizeSellerSettings(raw: Record<string, unknown>, storeId: string): SellerSettings {
  const store = (raw.store as Record<string, unknown> | undefined) ?? {};
  const payments = (raw.payments as Record<string, unknown> | undefined) ?? {};
  const shipping = (raw.shipping as Record<string, unknown> | undefined) ?? {};
  const api = (raw.api as Record<string, unknown> | undefined) ?? {};

  const VALID_METHODS = new Set<PaymentMethodId>(["credit_card", "pix", "boleto", "cash"]);
  const methods = payments.accepted_methods;
  const acceptedMethods: PaymentMethodId[] = Array.isArray(methods)
    ? methods
        .map((m) => String(m))
        .filter((m): m is PaymentMethodId => VALID_METHODS.has(m as PaymentMethodId))
    : ["pix", "credit_card"];

  const rulesRaw = shipping.rules;
  const rules: ShippingRule[] = Array.isArray(rulesRaw)
    ? rulesRaw.map((r) => {
        const row = r as Record<string, unknown>;
        return {
          region: String(row.region ?? "BR"),
          min_value: Number(row.min_value ?? 0),
          max_value: row.max_value == null ? null : Number(row.max_value),
          price: Number(row.price ?? 0),
          free_above: row.free_above == null ? null : Number(row.free_above),
        };
      })
    : [];

  return {
    store: {
      name: String(store.name ?? `Loja ${storeId.slice(0, 6)}`),
      description: String(store.description ?? ""),
      slug: String(store.slug ?? storeId.slice(0, 8)),
    },
    payments: {
      pix_key: String(payments.pix_key ?? store.pix_key ?? ""),
      pix_key_type: String(payments.pix_key_type ?? store.pix_key_type ?? "cpf"),
      stripe_account_id: payments.stripe_account_id
        ? String(payments.stripe_account_id)
        : store.stripe_account_id
          ? String(store.stripe_account_id)
          : null,
      accepted_methods: acceptedMethods.length > 0 ? acceptedMethods : ["pix"],
    },
    shipping: {
      default_price: Number(shipping.default_price ?? 0),
      rules,
    },
    api: {
      api_key_prefix: api.api_key_prefix ? String(api.api_key_prefix) : null,
      webhook_url: String(api.webhook_url ?? ""),
    },
  };
}
