import { z } from "zod";
import { PAIRING_FORMATS, TOURNAMENT_GAME_OPTIONS } from "@/lib/seller-tournament-form";
import { digitsOnlyCep } from "@/lib/geo/sp-distance";

export { PAIRING_FORMATS, TOURNAMENT_GAME_OPTIONS };

const tomorrowStart = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
};

export const sellerEventTicketFormSchema = z
  .object({
    name: z
      .string({ required_error: "Nome do evento é obrigatório" })
      .min(3, "Mínimo 3 caracteres")
      .max(100, "Máximo 100 caracteres"),
    address_city: z.string().min(2, "Cidade obrigatória").max(80),
    address_state: z
      .string()
      .length(2, "UF com 2 letras")
      .transform((v) => v.toUpperCase()),
    address_cep: z
      .string()
      .refine((v) => digitsOnlyCep(v).length === 8, "CEP no formato 00000-000"),
    event_date: z
      .string({ required_error: "Data obrigatória" })
      .refine((v) => !Number.isNaN(new Date(`${v}T12:00:00`).getTime()), "Data inválida")
      .refine((v) => new Date(`${v}T23:59:59`).getTime() >= tomorrowStart().getTime(), {
        message: "A data deve ser no futuro (não aceite hoje)",
      }),
    event_time: z
      .string({ required_error: "Horário obrigatório" })
      .regex(/^\d{2}:\d{2}$/, "Horário inválido"),
    game_id: z.string().min(1, "Selecione o jogo"),
    format_code: z.string().min(1, "Selecione o formato"),
    pairing_format: z.enum(["swiss", "single_elimination", "double_elimination", "round_robin"]),
    max_slots: z.coerce.number({ invalid_type_error: "Informe as vagas" }).int().min(2, "Mínimo 2 vagas"),
    banner_url: z.string().url("Envie o banner 350×500"),
    description: z.string().max(200, "Máximo 200 caracteres").optional().or(z.literal("")),
    notes: z.string().max(1000, "Máximo 1000 caracteres").optional().or(z.literal("")),
    contact_phone: z.string().min(8, "Telefone obrigatório").max(30),
  });

export type SellerEventTicketFormValues = z.infer<typeof sellerEventTicketFormSchema>;

export function eventTicketFormToApiPayload(
  values: SellerEventTicketFormValues,
  storeId: string,
) {
  const startsAt = new Date(`${values.event_date}T${values.event_time}:00`).toISOString();
  const cep = digitsOnlyCep(values.address_cep);
  const venue = `${values.address_city}/${values.address_state} — CEP ${cep.slice(0, 5)}-${cep.slice(5)}`;

  return {
    store_id: storeId,
    name: values.name.trim(),
    description: values.description?.trim() || null,
    game: values.game_id,
    format: values.format_code,
    event_type: "tournament",
    capacity: values.max_slots,
    starts_at: startsAt,
    venue,
    rules: values.notes?.trim() || null,
    banner_url: values.banner_url,
    image_url: values.banner_url,
    visibility: "public",
    status: "registration_open",
    policies: {
      address_city: values.address_city.trim(),
      address_state: values.address_state,
      address_cep: cep,
      contact_phone: values.contact_phone.trim(),
      pairing_format: values.pairing_format,
      notes: values.notes?.trim() || null,
    },
  };
}
