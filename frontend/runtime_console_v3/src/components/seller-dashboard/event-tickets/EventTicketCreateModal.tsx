"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventBannerUpload } from "@/components/seller-dashboard/event-tickets/EventBannerUpload";
import { useGameFormats } from "@/hooks/useTournamentGames";
import type { SellerStore } from "@/hooks/useSellerStore";
import {
  PAIRING_FORMATS,
  TOURNAMENT_GAME_OPTIONS,
  eventTicketFormToApiPayload,
  sellerEventTicketFormSchema,
  type SellerEventTicketFormValues,
} from "@/lib/seller-event-ticket-form";
import { formatCepMask } from "@/lib/geo/sp-distance";
import type { GameCode } from "@/lib/tcg-adapters";

type Props = {
  storeId: string;
  store: SellerStore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

function defaultDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function EventTicketCreateModal({
  storeId,
  store,
  open,
  onOpenChange,
  onCreated,
}: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SellerEventTicketFormValues>({
    resolver: zodResolver(sellerEventTicketFormSchema),
    defaultValues: {
      name: "",
      address_city: "",
      address_state: "",
      address_cep: "",
      event_date: defaultDate(),
      event_time: "14:00",
      game_id: "MTG",
      format_code: "STANDARD",
      pairing_format: "swiss",
      max_slots: 16,
      banner_url: "",
      description: "",
      notes: "",
      contact_phone: "",
    },
  });

  const gameId = watch("game_id") as GameCode;
  const description = watch("description") ?? "";
  const { data: formats } = useGameFormats(gameId);

  const missingAddress =
    !store?.city || !store?.state || !store?.postal_code || !store?.phone;

  useEffect(() => {
    if (!open) return;
    setValue("address_city", store?.city ?? "");
    setValue("address_state", (store?.state ?? "").toUpperCase());
    setValue("address_cep", store?.postal_code ? formatCepMask(store.postal_code) : "");
    setValue("contact_phone", store?.phone ?? "");
  }, [open, store, setValue]);

  useEffect(() => {
    if (formats?.[0]?.code) setValue("format_code", formats[0].code);
  }, [formats, setValue]);

  async function onSubmit(values: SellerEventTicketFormValues) {
    try {
      const eventRes = await fetch("/api/tournament-platform/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventTicketFormToApiPayload(values, storeId)),
      });
      const eventPayload = (await eventRes.json().catch(() => ({}))) as {
        event?: { id?: string };
        detail?: string;
      };
      if (!eventRes.ok || !eventPayload.event?.id) {
        throw new Error(String(eventPayload.detail ?? "Erro ao criar evento"));
      }
      const eventId = String(eventPayload.event.id);
      const ticketRes = await fetch(
        `/api/tournament-platform/events/${encodeURIComponent(eventId)}/tickets`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Ingresso",
            price_cents: 0,
            quantity: values.max_slots,
            capacity: values.max_slots,
          }),
        },
      );
      if (!ticketRes.ok) {
        const t = (await ticketRes.json().catch(() => ({}))) as { detail?: string };
        throw new Error(String(t.detail ?? "Evento criado, mas falhou ao gerar ingressos"));
      }
      toast.success("Evento criado");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar evento");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
          data-testid="event-ticket-create-modal"
        >
          <Dialog.Title className="text-lg font-semibold">Novo ingresso de evento</Dialog.Title>
          {missingAddress && (
            <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              Complete cidade, UF, CEP e telefone no{" "}
              <Link href="/vendedor/painel/configuracoes" className="underline">
                cadastro da loja
              </Link>{" "}
              para pré-preencher automaticamente.
            </p>
          )}
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="ev-name" className="text-sm text-muted-foreground">
                Nome do evento
              </label>
              <Input id="ev-name" className="mt-1" data-testid="event-name-input" {...register("name")} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="ev-city" className="text-sm text-muted-foreground">
                  Cidade
                </label>
                <Input id="ev-city" className="mt-1" data-testid="event-city-input" {...register("address_city")} />
                <FieldError message={errors.address_city?.message} />
              </div>
              <div>
                <label htmlFor="ev-uf" className="text-sm text-muted-foreground">
                  UF
                </label>
                <Input
                  id="ev-uf"
                  className="mt-1 uppercase"
                  maxLength={2}
                  data-testid="event-state-input"
                  {...register("address_state")}
                />
                <FieldError message={errors.address_state?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-cep" className="text-sm text-muted-foreground">
                  CEP
                </label>
                <Input
                  id="ev-cep"
                  className="mt-1"
                  data-testid="event-cep-input"
                  {...register("address_cep")}
                  onChange={(e) => setValue("address_cep", formatCepMask(e.target.value))}
                />
                <FieldError message={errors.address_cep?.message} />
              </div>
              <div>
                <label htmlFor="ev-phone" className="text-sm text-muted-foreground">
                  Telefone
                </label>
                <Input id="ev-phone" className="mt-1" data-testid="event-phone-input" {...register("contact_phone")} />
                <FieldError message={errors.contact_phone?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-date" className="text-sm text-muted-foreground">
                  Data
                </label>
                <Input id="ev-date" type="date" className="mt-1" data-testid="event-date-input" {...register("event_date")} />
                <FieldError message={errors.event_date?.message} />
              </div>
              <div>
                <label htmlFor="ev-time" className="text-sm text-muted-foreground">
                  Horário de início
                </label>
                <Input id="ev-time" type="time" className="mt-1" data-testid="event-time-input" {...register("event_time")} />
                <FieldError message={errors.event_time?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-game" className="text-sm text-muted-foreground">
                  Jogo
                </label>
                <select
                  id="ev-game"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  data-testid="event-game-select"
                  {...register("game_id")}
                >
                  {TOURNAMENT_GAME_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.game_id?.message} />
              </div>
              <div>
                <label htmlFor="ev-format" className="text-sm text-muted-foreground">
                  Formato
                </label>
                <select
                  id="ev-format"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  data-testid="event-format-select"
                  {...register("format_code")}
                >
                  {(formats ?? [{ code: "STANDARD", name: "Standard" }]).map((f) => (
                    <option key={f.code} value={f.code}>
                      {f.name ?? f.code}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.format_code?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ev-pairing" className="text-sm text-muted-foreground">
                  Estrutura
                </label>
                <select
                  id="ev-pairing"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  data-testid="event-pairing-select"
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
                <label htmlFor="ev-slots" className="text-sm text-muted-foreground">
                  Quantidade de vagas
                </label>
                <Input
                  id="ev-slots"
                  type="number"
                  min={2}
                  className="mt-1"
                  data-testid="event-slots-input"
                  {...register("max_slots")}
                />
                <FieldError message={errors.max_slots?.message} />
              </div>
            </div>

            <EventBannerUpload
              value={watch("banner_url") || null}
              onChange={(url) => setValue("banner_url", url ?? "", { shouldValidate: true })}
            />
            <FieldError message={errors.banner_url?.message} />

            <div>
              <label htmlFor="ev-desc" className="text-sm text-muted-foreground">
                Descrição ({description.length}/200)
              </label>
              <textarea
                id="ev-desc"
                rows={3}
                maxLength={200}
                className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="event-description-input"
                {...register("description")}
              />
              <FieldError message={errors.description?.message} />
            </div>

            <div>
              <label htmlFor="ev-notes" className="text-sm text-muted-foreground">
                Observações (premiação, produtos, instruções)
              </label>
              <textarea
                id="ev-notes"
                rows={4}
                maxLength={1000}
                className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="event-notes-input"
                {...register("notes")}
              />
              <FieldError message={errors.notes?.message} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting} data-testid="event-submit-btn">
                {isSubmitting ? "Publicando…" : "Publicar evento"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
