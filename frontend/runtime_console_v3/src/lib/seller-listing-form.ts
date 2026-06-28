import { z } from "zod";

/** Schema reutilizável para formulários de listagem (POC react-hook-form + zod). */
export const sellerListingFormSchema = z.object({
  price: z
    .number({ invalid_type_error: "Informe um preço válido" })
    .positive("Preço deve ser maior que zero"),
  quantity: z
    .number({ invalid_type_error: "Informe a quantidade" })
    .int("Quantidade deve ser inteira")
    .min(1, "Mínimo 1 unidade"),
  condition: z.enum(["NM", "LP", "MP", "HP", "DM"], {
    errorMap: () => ({ message: "Condição inválida" }),
  }),
});

export type SellerListingFormValues = z.infer<typeof sellerListingFormSchema>;

export function parseSellerListingForm(data: unknown) {
  return sellerListingFormSchema.safeParse(data);
}
