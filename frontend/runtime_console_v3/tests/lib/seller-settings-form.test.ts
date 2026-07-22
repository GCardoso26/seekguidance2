import { describe, expect, it } from "vitest";
import {
  parseApiSettingsForm,
  parsePaymentSettingsForm,
  parseShippingSettingsForm,
  parseStoreSettingsForm,
  paymentSettingsToApiPayload,
} from "@/lib/seller-settings-forms";

describe("seller-settings-forms", () => {
  it("aceita pagamentos com PIX e cartão", () => {
    const result = parsePaymentSettingsForm({
      pix_key: "11987654321",
      pix_key_type: "phone",
      accepted_methods: ["pix", "credit_card"],
    });
    expect(result.success).toBe(true);
  });

  it("mapeia preferência de pagamento para pix|stripe|both", () => {
    expect(
      paymentSettingsToApiPayload({
        pix_key: "a@b.com",
        pix_key_type: "email",
        accepted_methods: ["pix", "credit_card"],
      }).payment_method_preference,
    ).toBe("both");
    expect(
      paymentSettingsToApiPayload({
        pix_key: "",
        pix_key_type: "email",
        accepted_methods: ["credit_card"],
      }).payment_method_preference,
    ).toBe("stripe");
    expect(
      paymentSettingsToApiPayload({
        pix_key: "11987654321",
        pix_key_type: "phone",
        accepted_methods: ["pix"],
      }).payment_method_preference,
    ).toBe("pix");
  });

  it("aceita regra de frete válida", () => {
    const result = parseShippingSettingsForm({
      default_price: 15,
      rules: [{ region: "SP", min_value: 0, max_value: null, price: 12, free_above: 150 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejeita slug com espaços", () => {
    const result = parseStoreSettingsForm({
      name: "Minha Loja",
      description: "",
      slug: "minha loja",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita webhook URL inválida", () => {
    const result = parseApiSettingsForm({
      webhook_url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
