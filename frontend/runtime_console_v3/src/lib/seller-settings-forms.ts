import { z } from "zod";

const PIX_KEY_REGEX =
  /^(?:\d{11}|\d{14}|[\w.-]+@[\w.-]+\.\w{2,}|\+?\d{10,13}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const SLUG_REGEX = /^[a-z0-9-]+$/;

const paymentMethodEnum = z.enum(["credit_card", "pix", "boleto", "cash"]);

export const sellerPaymentSettingsSchema = z.object({
  pix_key: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v?.trim() || PIX_KEY_REGEX.test(v.trim()), "Chave PIX inválida"),
  pix_key_type: z.enum(["cpf", "cnpj", "email", "phone", "random"]),
  stripe_account_id: z.string().nullable().optional(),
  accepted_methods: z.array(paymentMethodEnum).min(1, "Selecione ao menos um método"),
});

export const sellerShippingRuleSchema = z.object({
  region: z.string().min(2, "Região obrigatória").max(10),
  min_value: z.coerce.number().min(0),
  max_value: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(),
  price: z.coerce.number().min(0),
  free_above: z.union([z.coerce.number().min(0), z.literal(""), z.null()]).optional(),
});

export const sellerShippingSettingsSchema = z.object({
  default_price: z.coerce.number().min(0, "Mínimo 0"),
  rules: z.array(sellerShippingRuleSchema).max(20),
});

export const sellerApiSettingsSchema = z.object({
  api_key: z.string().optional(),
  webhook_url: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => {
      if (!v?.trim()) return true;
      try {
        const u = new URL(v);
        return u.protocol === "https:" || u.protocol === "http:";
      } catch {
        return false;
      }
    }, "URL de webhook inválida"),
});

export const sellerStoreSettingsSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  description: z.string().max(500, "Máximo 500 caracteres").optional().or(z.literal("")),
  slug: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(60, "Máximo 60 caracteres")
    .regex(SLUG_REGEX, "Use apenas letras minúsculas, números e hífen"),
});

export type SellerPaymentSettingsFormValues = z.infer<typeof sellerPaymentSettingsSchema>;
export type SellerShippingSettingsFormValues = z.infer<typeof sellerShippingSettingsSchema>;
export type SellerApiSettingsFormValues = z.infer<typeof sellerApiSettingsSchema>;
export type SellerStoreSettingsFormValues = z.infer<typeof sellerStoreSettingsSchema>;

export function parsePaymentSettingsForm(data: unknown) {
  return sellerPaymentSettingsSchema.safeParse(data);
}

export function parseShippingSettingsForm(data: unknown) {
  return sellerShippingSettingsSchema.safeParse(data);
}

export function parseApiSettingsForm(data: unknown) {
  return sellerApiSettingsSchema.safeParse(data);
}

export function parseStoreSettingsForm(data: unknown) {
  return sellerStoreSettingsSchema.safeParse(data);
}

export function paymentSettingsToApiPayload(values: SellerPaymentSettingsFormValues) {
  return {
    pix_key: values.pix_key?.trim() ?? "",
    pix_key_type: values.pix_key_type,
    payment_method_preference: values.accepted_methods.includes("pix") ? "pix" : "card",
    accepted_methods: values.accepted_methods,
  };
}

export function shippingSettingsToApiPayload(values: SellerShippingSettingsFormValues) {
  return {
    default_price: values.default_price,
    rules: values.rules.map((r) => ({
      region: r.region,
      min_value: r.min_value,
      max_value: r.max_value === "" || r.max_value == null ? null : r.max_value,
      price: r.price,
      free_above: r.free_above === "" || r.free_above == null ? null : r.free_above,
    })),
  };
}

export function apiSettingsToApiPayload(values: SellerApiSettingsFormValues) {
  return {
    webhook_url: values.webhook_url?.trim() ?? "",
  };
}

export function storeSettingsToApiPayload(values: SellerStoreSettingsFormValues) {
  return {
    name: values.name.trim(),
    description: values.description?.trim() ?? "",
    slug: values.slug.trim(),
  };
}
