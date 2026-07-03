import { z } from "zod";

export const addListingFormSchema = z.object({
  price: z.number({ invalid_type_error: "Informe o preço" }).min(0.01, "Preço mínimo R$ 0,01"),
  quantity: z.number().int().min(1, "Mínimo 1"),
  language: z.enum(["pt", "en", "jp", "de", "es", "fr", "it"]),
  foil: z.boolean(),
  condition: z.enum(["NM", "LP", "MP", "HP", "DM"]),
  description: z.string().max(500).optional(),
  sku: z.string().max(64).optional(),
});

export type AddListingFormValues = z.infer<typeof addListingFormSchema>;

export function addListingToApiPayload(cardId: string, values: AddListingFormValues) {
  return {
    card_id: cardId,
    condition: values.condition,
    price: values.price,
    quantity: values.quantity,
    foil: values.foil,
    language: values.language,
    description: values.description || undefined,
  };
}
