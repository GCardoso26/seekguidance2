import { z } from "zod";

const CODE_REGEX = /^[A-Z0-9-]+$/;

const sellerCouponFormBase = z.object({
  code: z
    .string({ required_error: "Código é obrigatório" })
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .transform((v) => v.trim().toUpperCase())
    .refine((v) => CODE_REGEX.test(v), "Use apenas letras, números e hífen"),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.coerce.number({ invalid_type_error: "Valor inválido" }).min(0.01, "Mínimo 0,01"),
  max_uses: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  expires_at: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => {
      if (!v?.trim()) return true;
      return !Number.isNaN(new Date(v).getTime());
    }, "Data inválida"),
  min_order_value: z.coerce.number().min(0, "Mínimo 0").optional(),
  is_active: z.boolean(),
});

export const sellerCouponFormSchema = sellerCouponFormBase.superRefine((data, ctx) => {
  if (data.discount_type === "percentage" && data.discount_value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Percentual máximo é 100%",
      path: ["discount_value"],
    });
  }
  if (data.discount_type === "fixed" && data.discount_value > 10000) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valor máximo é R$ 100,00",
      path: ["discount_value"],
    });
  }
});

export type SellerCouponFormValues = z.infer<typeof sellerCouponFormBase>;

export function parseSellerCouponForm(data: unknown) {
  return sellerCouponFormSchema.safeParse(data);
}

export function couponFormToApiPayload(values: SellerCouponFormValues) {
  const valueCents =
    values.discount_type === "percentage"
      ? Math.round(values.discount_value)
      : Math.round(values.discount_value);

  const maxUses =
    values.max_uses === "" || values.max_uses === undefined ? null : values.max_uses;

  const payload: Record<string, unknown> = {
    code: values.code,
    type: values.discount_type,
    value_cents: valueCents,
    min_order_cents: Math.round((values.min_order_value ?? 0) * 100),
    max_uses: maxUses,
    is_active: values.is_active,
  };

  if (values.expires_at?.trim()) {
    payload.expires_at = new Date(values.expires_at).toISOString();
  }

  return payload;
}

export function couponFromApiRow(row: {
  code: string;
  type: string;
  value_cents: number;
  min_order_cents?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
}): SellerCouponFormValues {
  const type = row.type === "fixed" ? "fixed" : "percentage";
  return {
    code: row.code.toUpperCase(),
    discount_type: type,
    discount_value: row.value_cents,
    max_uses: row.max_uses ?? "",
    expires_at: row.expires_at ? row.expires_at.slice(0, 10) : "",
    min_order_value: (row.min_order_cents ?? 0) / 100,
    is_active: row.is_active !== false,
  };
}

export function randomCouponCode(): string {
  return `JUDGE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}
