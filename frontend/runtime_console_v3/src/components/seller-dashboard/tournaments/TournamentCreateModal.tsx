"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGameFormats } from "@/hooks/useTournamentGames";
import {
  PAIRING_FORMATS,
  TOURNAMENT_GAME_OPTIONS,
  sellerTournamentFormSchema,
  tournamentFormToApiPayload,
  type SellerTournamentFormValues,
} from "@/lib/seller-tournament-form";
import type { GameCode } from "@/lib/tcg-adapters";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const defaultDate = () => {
  const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d.toISOString().slice(0, 16);
};

const emptyValues: SellerTournamentFormValues = {
  name: "",
  pairing_format: "swiss",
  game_id: "MTG",
  format_code: "STANDARD",
  date: defaultDate(),
  entry_fee: 0,
  max_players: 32,
  description: "",
  prizes: "",
  location: "",
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function TournamentCreateModal({ open, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SellerTournamentFormValues>({
    resolver: zodResolver(sellerTournamentFormSchema),
    defaultValues: emptyValues,
  });

  const gameId = watch("game_id") as GameCode;
  const { data: formats } = useGameFormats(gameId);

  useEffect(() => {
    if (formats?.[0]?.code) {
      setValue("format_code", formats[0].code);
    }
  }, [formats, setValue]);

  async function onSubmit(values: SellerTournamentFormValues) {
    try {
      const res = await fetch("/api/tournament/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tournamentFormToApiPayload(values)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Erro ao criar torneio"));
      }
      toast.success("Torneio criado");
      reset({ ...emptyValues, date: defaultDate() });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar torneio");
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset({ ...emptyValues, date: defaultDate() });
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,36rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
          data-testid="tournament-create-modal"
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">Novo torneio</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="tournament-name" className="text-sm text-muted-foreground">
                Nome
              </label>
              <Input
                id="tournament-name"
                className="mt-1 border-border bg-foreground/30"
                data-testid="tournament-name-input"
                {...register("name")}
              />
              <FieldError message={errors.name?.message} />
            </div>

            <div>
              <label htmlFor="tournament-game" className="text-sm text-muted-foreground">
                Jogo
              </label>
              <select
                id="tournament-game"
                className="mt-1 w-full rounded-md border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="tournament-game-select"
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
              <label htmlFor="tournament-format-code" className="text-sm text-muted-foreground">
                Formato de jogo
              </label>
              <select
                id="tournament-format-code"
                className="mt-1 w-full rounded-md border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="tournament-format-code-select"
                {...register("format_code")}
              >
                {(formats ?? [{ code: "STANDARD", name: "Standard" }]).map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tournament-pairing" className="text-sm text-muted-foreground">
                Estrutura
              </label>
              <select
                id="tournament-pairing"
                className="mt-1 w-full rounded-md border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="tournament-pairing-select"
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
              <label htmlFor="tournament-date" className="text-sm text-muted-foreground">
                Data e hora
              </label>
              <Input
                id="tournament-date"
                type="datetime-local"
                className="mt-1 border-border bg-foreground/30"
                data-testid="tournament-date-input"
                {...register("date")}
              />
              <FieldError message={errors.date?.message} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="tournament-fee" className="text-sm text-muted-foreground">
                  Taxa (R$)
                </label>
                <Input
                  id="tournament-fee"
                  type="number"
                  min={0}
                  step={0.01}
                  className="mt-1 border-border bg-foreground/30"
                  data-testid="tournament-fee-input"
                  {...register("entry_fee")}
                />
                <FieldError message={errors.entry_fee?.message} />
              </div>
              <div>
                <label htmlFor="tournament-max" className="text-sm text-muted-foreground">
                  Máx. jogadores
                </label>
                <Input
                  id="tournament-max"
                  type="number"
                  min={2}
                  className="mt-1 border-border bg-foreground/30"
                  data-testid="tournament-max-players-input"
                  {...register("max_players")}
                />
              </div>
            </div>

            <div>
              <label htmlFor="tournament-location" className="text-sm text-muted-foreground">
                Local
              </label>
              <Input
                id="tournament-location"
                placeholder="Endereço ou Online"
                className="mt-1 border-border bg-foreground/30"
                data-testid="tournament-location-input"
                {...register("location")}
              />
            </div>

            <div>
              <label htmlFor="tournament-description" className="text-sm text-muted-foreground">
                Descrição
              </label>
              <textarea
                id="tournament-description"
                rows={3}
                className="mt-1 w-full rounded-md border border-border bg-foreground/30 px-3 py-2 text-sm"
                data-testid="tournament-description-input"
                {...register("description")}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} data-testid="tournament-submit-btn">
              {isSubmitting ? "Criando…" : "Criar torneio"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
