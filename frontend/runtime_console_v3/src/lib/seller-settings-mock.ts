import type { SellerSettings } from "@/types/seller-settings";

/** Mock determinístico para dev/E2E quando a API falha. */
export function buildSellerSettingsMock(storeId: string): SellerSettings {
  return {
    store: {
      name: "Minha Loja TCG",
      description: "Cards, acessórios e eventos.",
      slug: `loja-${storeId.slice(0, 8)}`,
    },
    payments: {
      pix_key: "",
      pix_key_type: "cpf",
      stripe_account_id: null,
      accepted_methods: ["pix", "credit_card"],
    },
    shipping: {
      default_price: 15,
      rules: [
        {
          region: "SP",
          min_value: 0,
          max_value: null,
          price: 12,
          free_above: 150,
        },
        {
          region: "BR",
          min_value: 0,
          max_value: null,
          price: 18,
          free_above: 200,
        },
      ],
    },
    api: {
      api_key_prefix: "jdg_live_",
      webhook_url: "",
    },
  };
}
