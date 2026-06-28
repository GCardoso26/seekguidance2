import { z } from "zod";

const conditionEnum = z.enum(["nm", "lp", "mp", "hp"], {
  errorMap: () => ({ message: "Condição inválida" }),
});

/** Schema do formulário de nova listagem (Fase 1 — RHF + zod). */
export const sellerListingFormSchema = z.object({
  name: z
    .string({ required_error: "Nome é obrigatório" })
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres"),
  price: z
    .number({ invalid_type_error: "Informe um preço válido" })
    .min(0.01, "Preço mínimo R$ 0,01"),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Quantidade deve ser inteira")
    .min(1, "Mínimo 1 unidade"),
  condition: conditionEnum,
  description: z.string().max(500, "Máximo 500 caracteres").optional(),
  foil: z.boolean().optional(),
});

export type SellerListingFormValues = z.infer<typeof sellerListingFormSchema>;

/** Converte condição do form para API (uppercase). */
export function listingConditionToApi(condition: SellerListingFormValues["condition"]): string {
  return condition.toUpperCase();
}

export function parseSellerListingForm(data: unknown) {
  return sellerListingFormSchema.safeParse(data);
}

/** Schema legado (POC) — compat tests que usam NM/LP uppercase. */
export const sellerListingFormSchemaLegacy = z.object({
  price: z.number().positive(),
  quantity: z.number().int().min(1),
  condition: z.enum(["NM", "LP", "MP", "HP", "DM"]),
});

export type SellerListingFormValuesLegacy = z.infer<typeof sellerListingFormSchemaLegacy>;
