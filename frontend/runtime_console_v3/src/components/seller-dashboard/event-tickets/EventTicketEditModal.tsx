"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventBannerUpload } from "@/components/seller-dashboard/event-tickets/EventBannerUpload";
import { useGameFormats } from "@/hooks/useTournamentGames";
import {
  PAIRING_FORMATS,
  TOURNAMENT_GAME_OPTIONS,
  eventTicketFormToApiPayload,
  reaisToCents,
  sellerEventTicketEditSchema,
  storeEventToEditDefaults,
  type SellerEventTicketEditValues,
} from "@/lib/seller-event-ticket-form";
import { formatCepMask } from "@/lib/geo/sp-distance";
import type { GameCode } from "@/lib/tcg-adapters";
import type { StoreEventRow } from "@/types/store-event";

type Props = {
  storeId: string;
  event: StoreEventRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function EventTicketEditModal({
  storeId,
  event,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SellerEventTicketEditValues>({
    resolver: zodResolver(sellerEventTicketEditSchema),
  });

  const gameId = watch("game_id") as GameCode;
  const description = watch("description") ?? "";
  const registrationOpen = watch("registration_open");
  const { data: formats } = useGameFormats(gameId);

  useEffect(() => {
    if (!open || !event) return;
    reset(storeEventToEditDefaults(event));
    setTicketId(null);
    void (async () => {
      const res = await fetch(
        `/api/tournament-platform/events/${encodeURIComponent(event.id)}/tickets`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { tickets?: Array<{ id?: string }> };
      const first = data.tickets?.[0]?.id;
      if (first) setTicketId(String(first));
    })();
  }, [open, event, reset]);

  async function onSubmit(values: SellerEventTicketEditValues) {
    if (!event) return;
    try {
      const payload = eventTicketFormToApiPayload(values, storeId);
      const eventRes = await fetch(
        `/api/tournament-platform/events/${encodeURIComponent(event.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            description: payload.description,
            game: payload.game,
            format: payload.format,
            capacity: payload.capacity,
            starts_at: payload.starts_at,
            venue: payload.venue,
            rules: payload.rules,
            banner_url: payload.banner_url,
            image_url: payload.image_url,
            visibility: payload.visibility,
            status: payload.status,
            policies: payload.policies,
          }),
        },
      );
      if (!eventRes.ok) {
        const err = (await eventRes.json().catch(() => ({}))) as { detail?: string };
        throw new Error(String(err.detail ?? "Erro ao salvar evento"));
      }

      const ticketBody = {
        price_cents: reaisToCents(values.price_reais),
        quantity: values.max_slots,
        capacity: values.max_slots,
      };
      if (ticketId) {
        const ticketRes = await fetch(
          `/api/tournament-platform/tickets/${encodeURIComponent(ticketId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketBody),
          },
        );
        if (!ticketRes.ok) {
          const err = (await ticketRes.json().catch(() => ({}))) as { detail?: string };
          throw new Error(String(err.detail ?? "Evento salvo, falha ao atualizar ingresso"));
        }
      } else {
        const ticketRes = await fetch(
          `/api/tournament-platform/events/${encodeURIComponent(event.id)}/tickets`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Ingresso", ...ticketBody }),
          },
        );
        if (!ticketRes.ok) {
          throw new Error("Evento salvo, falha ao criar ingresso");
        }
      }

      toast.success("Alterações salvas");
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
          data-testid="event-ticket-edit-modal"
        >
          <Dialog.Title className="text-lg font-semibold">Editar evento</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="ed-name" className="text-sm text-muted-foreground">
                Nome do evento
              </label>
              <Input id="ed-name" className="mt-1" data-testid="event-edit-name" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="ed-city" className="text-sm text-muted-foreground">
                  Cidade
                </label>
                <Input id="ed-city" className="mt-1" {...register("address_city")} />
                <FieldError message={errors.address_city?.message} />
              </div>
              <div>
                <label htmlFor="ed-uf" className="text-sm text-muted-foreground">
                  UF
                </label>
                <Input id="ed-uf" className="mt-1 uppercase" maxLength={2} {...register("address_state")} />
                <FieldError message={errors.address_state?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ed-cep" className="text-sm text-muted-foreground">
                  CEP
                </label>
                <Input
                  id="ed-cep"
                  className="mt-1"
                  {...register("address_cep")}
                  onChange={(e) => setValue("address_cep", formatCepMask(e.target.value))}
                />
                <FieldError message={errors.address_cep?.message} />
              </div>
              <div>
                <label htmlFor="ed-phone" className="text-sm text-muted-foreground">
                  Telefone
                </label>
                <Input id="ed-phone" className="mt-1" {...register("contact_phone")} />
                <FieldError message={errors.contact_phone?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ed-date" className="text-sm text-muted-foreground">
                  Data
                </label>
                <Input id="ed-date" type="date" className="mt-1" {...register("event_date")} />
                <FieldError message={errors.event_date?.message} />
              </div>
              <div>
                <label htmlFor="ed-time" className="text-sm text-muted-foreground">
                  Horário
                </label>
                <Input id="ed-time" type="time" className="mt-1" {...register("event_time")} />
                <FieldError message={errors.event_time?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ed-game" className="text-sm text-muted-foreground">
                  Jogo
                </label>
                <select
                  id="ed-game"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  {...register("game_id")}
                >
                  {TOURNAMENT_GAME_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ed-format" className="text-sm text-muted-foreground">
                  Formato
                </label>
                <select
                  id="ed-format"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  {...register("format_code")}
                >
                  {(formats ?? [{ code: "STANDARD", name: "Standard" }]).map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name ?? f.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ed-pairing" className="text-sm text-muted-foreground">
                  Estrutura
                </label>
                <select
                  id="ed-pairing"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  {...register("pairing_format")}
                >
                  {PAIRING_FORMATS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ed-slots" className="text-sm text-muted-foreground">
                  Vagas
                </label>
                <Input id="ed-slots" type="number" min={2} className="mt-1" {...register("max_slots")} />
                <FieldError message={errors.max_slots?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="ed-price" className="text-sm text-muted-foreground">
                Valor da inscrição (R$)
              </label>
              <Input
                id="ed-price"
                type="number"
                min={0}
                step="0.01"
                className="mt-1"
                data-testid="event-edit-price"
                {...register("price_reais")}
              />
              <FieldError message={errors.price_reais?.message} />
            </div>

            <label className="flex items-center gap-2 text-sm" data-testid="event-edit-registration-toggle">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(registrationOpen)}
                onChange={(e) => setValue("registration_open", e.target.checked)}
              />
              Inscrições abertas
            </label>

            <EventBannerUpload
              value={watch("banner_url") || null}
              onChange={(url) => setValue("banner_url", url ?? "", { shouldValidate: true })}
            />

            <div>
              <label htmlFor="ed-desc" className="text-sm text-muted-foreground">
                Descrição ({description.length}/200)
              </label>
              <textarea
                id="ed-desc"
                rows={3}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                {...register("description")}
              />
            </div>

            <div>
              <label htmlFor="ed-notes" className="text-sm text-muted-foreground">
                Observações
              </label>
              <textarea
                id="ed-notes"
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                {...register("notes")}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting} data-testid="event-edit-submit">
                {isSubmitting ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
