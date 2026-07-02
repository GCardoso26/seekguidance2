import { buildSellerSettingsMock } from "@/lib/seller-settings-mock";
import { normalizeSellerSettings, type SellerSettings } from "@/types/seller-settings";

const overlayByStore = new Map<string, Partial<SellerSettings>>();

function deepMerge(base: SellerSettings, patch: Partial<SellerSettings>): SellerSettings {
  return {
    store: { ...base.store, ...patch.store },
    payments: { ...base.payments, ...patch.payments },
    shipping: {
      ...base.shipping,
      ...patch.shipping,
      rules: patch.shipping?.rules ?? base.shipping.rules,
    },
    api: { ...base.api, ...patch.api },
  };
}

export function mergeSettingsFromApi(storeId: string, payload: Record<string, unknown>): SellerSettings {
  const store = (payload.store as Record<string, unknown> | undefined) ?? {};
  const normalized = normalizeSellerSettings(
    {
      store,
      payments: {
        pix_key: store.pix_key,
        pix_key_type: store.pix_key_type,
        stripe_account_id: store.stripe_account_id,
        accepted_methods: payload.accepted_methods ?? ["pix", "credit_card"],
      },
      shipping: payload.shipping,
      api: payload.api,
    },
    storeId,
  );
  const overlay = overlayByStore.get(storeId);
  return overlay ? deepMerge(normalized, overlay) : normalized;
}

export function getSettingsWithMockFallback(storeId: string, apiPayload?: Record<string, unknown>): SellerSettings {
  if (apiPayload && Object.keys(apiPayload).length > 0) {
    return mergeSettingsFromApi(storeId, apiPayload);
  }
  const mock = buildSellerSettingsMock(storeId);
  const overlay = overlayByStore.get(storeId);
  return overlay ? deepMerge(mock, overlay) : mock;
}

export function patchSettingsOverlay(
  storeId: string,
  section: string,
  data: Record<string, unknown>,
): SellerSettings {
  const current = getSettingsWithMockFallback(storeId);
  let patch: Partial<SellerSettings> = {};

  if (section === "store") {
    patch = { store: data as SellerSettings["store"] };
  } else if (section === "payments") {
    patch = { payments: data as SellerSettings["payments"] };
  } else if (section === "shipping") {
    patch = { shipping: data as SellerSettings["shipping"] };
  } else if (section === "api") {
    patch = { api: data as SellerSettings["api"] };
  }

  const merged = deepMerge(current, patch);
  const prevOverlay = overlayByStore.get(storeId) ?? {};
  overlayByStore.set(storeId, { ...prevOverlay, ...patch });
  return merged;
}
