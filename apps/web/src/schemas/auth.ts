import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  displayName: z.string().min(1, "Nome obrigatório"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
