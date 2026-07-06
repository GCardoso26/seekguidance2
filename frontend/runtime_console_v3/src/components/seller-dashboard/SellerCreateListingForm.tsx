"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { CardImage } from "@/components/ui/CardImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cardImageUrl } from "@/lib/format-currency";
import {
  listingConditionToApi,
  sellerListingFormSchema,
  type SellerListingFormValues,
} from "@/lib/seller-listing-form";
import type { UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";

const CONDITIONS: SellerListingFormValues["condition"][] = ["nm", "lp", "mp", "hp"];

type Props = {
  card: UnifiedCard;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

export function SellerCreateListingForm({ card }: Props) {
  const router = useRouter();
  const imageSrc = cardImageUrl(card);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SellerListingFormValues>({
    resolver: zodResolver(sellerListingFormSchema),
    defaultValues: {
      name: card.name,
      price: undefined,
      quantity: 1,
      condition: "nm",
      description: "",
      foil: false,
    },
  });

  const condition = watch("condition");

  async function onSubmit(values: SellerListingFormValues) {
    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          condition: listingConditionToApi(values.condition),
          price: values.price,
          quantity: values.quantity,
          foil: values.foil ?? false,
          language: card.language || "pt",
          description: values.description?.trim() || undefined,
        }),
      });

      if (res.status === 401) {
        router.push(`/entrar?next=${encodeURIComponent(`/vendedor/painel/listagens/nova?cardId=${card.id}`)}`);
        return;
      }

      if (!res.ok) {
        throw new Error("api_error");
      }

      toast.success("Listagem criada");
      router.push("/vendedor/painel/listagens");
    } catch {
      toast.error("Erro ao criar listagem. Tente novamente.");
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-lg font-bold text-white">Nova listagem</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
          <CardImage
            src={imageSrc}
            alt={card.name}
            fill
            className="object-cover"
            sizes="44px"
          />
        </div>
        <div>
          <p className="font-medium text-white">{card.name}</p>
          <p className="text-xs text-luxury-mist">{card.set?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" data-testid="create-listing-form">
        <div>
          <label htmlFor="listing-name" className="text-sm font-medium text-luxury-mist">
            Nome
          </label>
          <Input
            id="listing-name"
            className="mt-1 border-white/10 bg-luxury-onyx"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-luxury-mist">Condição</p>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue("condition", c, { shouldValidate: true })}
                className={cn(
                  "rounded-lg border p-2 transition-colors",
                  condition === c ? "border-luxury-gold bg-luxury-gold/10" : "border-white/10 hover:border-white/20",
                )}
              >
                <ConditionBadge condition={c.toUpperCase() as CardCondition} size="sm" />
              </button>
            ))}
          </div>
          <FieldError message={errors.condition?.message} />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="listing-price" className="text-sm font-medium text-luxury-mist">
              Preço (R$)
            </label>
            <Input
              id="listing-price"
              type="number"
              step="0.01"
              min="0.01"
              className="mt-1 border-white/10 bg-luxury-onyx"
              {...register("price", { valueAsNumber: true })}
            />
            <FieldError message={errors.price?.message} />
          </div>
          <div className="w-24">
            <label htmlFor="listing-qty" className="text-sm font-medium text-luxury-mist">
              Qtd
            </label>
            <Input
              id="listing-qty"
              type="number"
              min="1"
              className="mt-1 border-white/10 bg-luxury-onyx"
              {...register("quantity", { valueAsNumber: true })}
            />
            <FieldError message={errors.quantity?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="listing-desc" className="text-sm font-medium text-luxury-mist">
            Descrição (opcional)
          </label>
          <textarea
            id="listing-desc"
            rows={3}
            className="mt-1 w-full rounded-md border border-white/10 bg-luxury-onyx px-3 py-2 text-sm text-white"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-luxury-mist">
          <input type="checkbox" className="rounded" {...register("foil")} />
          Versão Foil
        </label>

        <Button
          type="submit"
          className="w-full bg-luxury-gold font-semibold text-luxury-onyx hover:bg-luxury-gold-light"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          Publicar
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-luxury-mist">
        <Link href="/vendedor/painel/listagens" className="hover:text-luxury-gold">
          ← Voltar às listagens
        </Link>
      </p>
    </div>
  );
}
