"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { X } from "lucide-react";
import Image from "next/image";
import {
  addListingFormSchema,
  addListingToApiPayload,
  type AddListingFormValues,
} from "@/lib/seller-catalog-listing-form";
import type { CatalogCard } from "@/hooks/useCatalogCards";
import { formatRarityDisplay } from "@/lib/game-config/rarity";

type Props = {
  card: CatalogCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

const LANGUAGES = [
  { value: "pt", label: "PT-BR" },
  { value: "en", label: "EN" },
  { value: "jp", label: "JP" },
  { value: "de", label: "DE" },
] as const;

const CONDITIONS = ["NM", "LP", "MP", "HP", "DM"] as const;

export function AddListingDrawer({ card, open, onOpenChange, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddListingFormValues>({
    resolver: zodResolver(addListingFormSchema),
    defaultValues: {
      price: 0,
      quantity: 1,
      language: "pt",
      foil: false,
      condition: "NM",
      description: "",
      sku: "",
    },
  });

  const foil = watch("foil");
  const condition = watch("condition");
  const language = watch("language");

  async function onSubmit(values: AddListingFormValues, addAnother = false) {
    if (!card) return;
    const res = await fetch("/api/seller/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addListingToApiPayload(card.id, values)),
    });
    if (!res.ok) {
      toast.error("Erro ao cadastrar");
      return;
    }
    toast.success("Cadastrado com sucesso");
    onSaved?.();
    if (addAnother) {
      reset({ ...values, quantity: 1, description: "", sku: "" });
    } else {
      onOpenChange(false);
      reset();
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-background shadow-xl outline-none">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              Adicionar anúncio — {card?.name ?? ""}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1 hover:bg-muted" aria-label="Fechar">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {card && (
            <form
              className="flex flex-1 flex-col overflow-y-auto p-4"
              onSubmit={handleSubmit((v) => onSubmit(v, false))}
            >
              <div className="mb-4 flex gap-3">
                {card.image_url && (
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded">
                    <Image src={card.image_url} alt="" fill className="object-cover" unoptimized />
                  </div>
                )}
                <div className="text-sm">
                  <p className="font-semibold">{card.name}</p>
                  {card.set_name && <p className="text-muted-foreground">{card.set_name}</p>}
                  {card.rarity && (
                    <p className="text-xs text-muted-foreground">
                      Raridade: {formatRarityDisplay(card.game, card.rarity)}
                    </p>
                  )}
                </div>
              </div>

              <label className="mb-3 block text-sm">
                Preço (R$) *
                <input
                  type="number"
                  step="0.01"
                  aria-label="Preço"
                  className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && <span className="text-xs text-danger">{errors.price.message}</span>}
              </label>

              <label className="mb-3 block text-sm">
                Quantidade *
                <input
                  type="number"
                  aria-label="Quantidade"
                  className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                  {...register("quantity", { valueAsNumber: true })}
                />
                {errors.quantity && (
                  <span className="text-xs text-danger">{errors.quantity.message}</span>
                )}
              </label>

              <fieldset className="mb-3">
                <legend className="text-sm">Idioma</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setValue("language", lang.value)}
                      className={`rounded px-2 py-1 text-xs ${
                        language === lang.value ? "bg-primary/30 text-primary" : "bg-muted/50"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mb-3">
                <legend className="text-sm">Foil</legend>
                <div className="mt-1 flex gap-3 text-sm">
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={foil} onChange={() => setValue("foil", true)} /> Sim
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={!foil} onChange={() => setValue("foil", false)} /> Não
                  </label>
                </div>
              </fieldset>

              <fieldset className="mb-3">
                <legend className="text-sm">Condição</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setValue("condition", c)}
                      className={`rounded px-2 py-1 text-xs ${
                        condition === c ? "bg-primary/30 text-primary" : "bg-muted/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mb-3 block text-sm">
                Observações
                <textarea
                  className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                  rows={2}
                  {...register("description")}
                />
              </label>

              <label className="mb-4 block text-sm">
                SKU (opcional)
                <input
                  className="mt-1 w-full surface-card rounded-lg px-3 py-2"
                  {...register("sku")}
                />
              </label>

              <div className="mt-auto flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="save-product"
                  className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit((v) => onSubmit(v, true))}
                  className="flex-1 rounded-lg border border-border py-2 text-sm disabled:opacity-50"
                >
                  Salvar e adicionar outra
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
