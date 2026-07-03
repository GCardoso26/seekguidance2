import { describe, expect, it } from "vitest";
import {
  couponFormToApiPayload,
  parseSellerCouponForm,
} from "@/lib/seller-coupon-form";

describe("seller-coupon-form", () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  it("aceita cupom percentual válido com validade futura", () => {
    const result = parseSellerCouponForm({
      code: "VERAO10",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: 100,
      expires_at: futureDate,
      min_order_value: 50,
      is_active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const payload = couponFormToApiPayload(result.data);
      expect(payload.type).toBe("percentage");
      expect(payload.value_cents).toBe(10);
      expect(payload.min_order_cents).toBe(5000);
    }
  });

  it("rejeita percentual acima de 100", () => {
    const result = parseSellerCouponForm({
      code: "BIGOFF",
      discount_type: "percentage",
      discount_value: 150,
      is_active: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita código com caracteres especiais", () => {
    const result = parseSellerCouponForm({
      code: "OFF@50!",
      discount_type: "percentage",
      discount_value: 10,
      is_active: true,
    });
    expect(result.success).toBe(false);
  });

  it("aceita cupom fixo ilimitado (R$ 15,00 em centavos)", () => {
    const result = parseSellerCouponForm({
      code: "FIXO15",
      discount_type: "fixed",
      discount_value: 1500,
      max_uses: "",
      min_order_value: 0,
      is_active: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      const payload = couponFormToApiPayload(result.data);
      expect(payload.type).toBe("fixed");
      expect(payload.value_cents).toBe(1500);
      expect(payload.max_uses).toBeNull();
    }
  });

  it("exporta schema zod utilizável", () => {
    const ok = parseSellerCouponForm({
      code: "ABC",
      discount_type: "fixed",
      discount_value: 100,
      is_active: true,
    });
    expect(ok.success).toBe(true);
  });
});
