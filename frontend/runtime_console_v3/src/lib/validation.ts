import { z } from "zod";

export const CardSearchSchema = z.object({
  q: z.string().max(100).optional(),
  game: z.string().max(20).optional(),
  set: z.string().max(40).optional(),
  rarity: z.string().max(30).optional(),
  condition: z.string().max(20).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  language: z.string().max(10).optional(),
  foil: z.enum(["true", "false"]).optional(),
  sort: z.string().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  card_id: z.string().max(80).optional(),
  colors: z.string().max(40).optional(),
});

export const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

export function validationErrorResponse(error: z.ZodError) {
  return Response.json(
    { error: "invalid_input", issues: error.issues.map((i) => ({ path: i.path, message: i.message })) },
    { status: 400 },
  );
}
