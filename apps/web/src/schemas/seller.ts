import { z } from "zod";

export const onboardSchema = z.object({
  displayName: z.string().min(2, "Nome da loja obrigatório"),
});

export type OnboardFormValues = z.infer<typeof onboardSchema>;

export const commercialSchema = z.object({
  quantity: z.number().int().min(1, "Mínimo 1"),
  condition: z.enum(["NM", "LP", "MP", "HP", "DM"]),
  language: z.string().min(2, "Idioma obrigatório"),
  foil: z.boolean(),
  priceReais: z.number().positive("Informe o preço"),
});

export type CommercialFormValues = z.infer<typeof commercialSchema>;

export function priceReaisToCents(reais: number): number {
  return Math.round(reais * 100);
}
