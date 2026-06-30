"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  formToAlertPayload,
  priceAlertFormSchema,
  type PriceAlertFormValues,
} from "@/lib/wishlist-price-alert";
import {
  useCreatePriceAlert,
  useDeletePriceAlert,
  usePriceAlertForProduct,
  useUpdatePriceAlert,
} from "@/hooks/useWishlistPriceAlerts";
import type { ShopProduct } from "@/lib/marketplace-shop";
import { formatShopPrice } from "@/lib/marketplace-shop";

type Props = {
  productId: string;
  product?: ShopProduct;
  baselinePriceCents: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PriceAlertModal({
  productId,
  product,
  baselinePriceCents,
  open,
  onOpenChange,
}: Props) {
  const existing = usePriceAlertForProduct(productId);
  const create = useCreatePriceAlert();
  const update = useUpdatePriceAlert();
  const remove = useDeletePriceAlert();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PriceAlertFormValues>({
    resolver: zodResolver(priceAlertFormSchema),
    defaultValues: {
      alert_type: existing?.alert_type ?? "any_drop",
      target_price_reais:
        existing?.target_price != null ? existing.target_price / 100 : "",
      percentage: existing?.percentage ?? "",
    },
  });

  const alertType = watch("alert_type");

  const onSubmit = handleSubmit(async (values) => {
    const payload = formToAlertPayload(values, baselinePriceCents);
    try {
      if (existing) {
        await update.mutateAsync({
          id: existing.id,
          patch: {
            alert_type: payload.alert_type,
            target_price: payload.target_price,
            percentage: payload.percentage,
            is_active: true,
          },
        });
        toast.success("Alerta atualizado");
      } else {
        await create.mutateAsync({
          product_id: productId,
          ...payload,
          product,
        });
        toast.success("Alerta de preço criado");
      }
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar o alerta");
    }
  });

  const handleRemove = async () => {
    if (!existing) {
      onOpenChange(false);
      return;
    }
    try {
      await remove.mutateAsync(existing.id);
      toast.success("Alerta removido");
      reset({ alert_type: "any_drop", target_price_reais: "", percentage: "" });
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível remover o alerta");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[min(100%,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-luxury-obsidian p-6 shadow-xl"
          data-testid="price-alert-modal"
        >
          <Dialog.Title className="text-lg font-semibold text-luxury-frost">
            Alerta de preço
          </Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-luxury-mist">
            {product?.name ?? "Produto"} — preço atual {formatShopPrice(baselinePriceCents)}
          </Dialog.Description>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-luxury-frost">Quando avisar?</legend>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="any_drop" {...register("alert_type")} />
                Qualquer redução
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="target_price" {...register("alert_type")} />
                Quando chegar em R$
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="percentage_drop" {...register("alert_type")} />
                Quando cair %
              </label>
            </fieldset>

            {alertType === "target_price" && (
              <div>
                <label htmlFor="target_price_reais" className="text-xs text-luxury-mist">
                  Preço alvo (R$)
                </label>
                <Input
                  id="target_price_reais"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="mt-1"
                  data-testid="price-alert-target-input"
                  {...register("target_price_reais")}
                />
                {errors.target_price_reais && (
                  <p className="mt-1 text-xs text-red-400">{errors.target_price_reais.message}</p>
                )}
              </div>
            )}

            {alertType === "percentage_drop" && (
              <div>
                <label htmlFor="percentage" className="text-xs text-luxury-mist">
                  Queda mínima (%)
                </label>
                <Input
                  id="percentage"
                  type="number"
                  min="1"
                  max="99"
                  className="mt-1"
                  data-testid="price-alert-percent-input"
                  {...register("percentage")}
                />
                {errors.percentage && (
                  <p className="mt-1 text-xs text-red-400">{errors.percentage.message}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="submit"
                data-testid="price-alert-save"
                disabled={create.isPending || update.isPending}
              >
                {existing ? "Salvar" : "Criar alerta"}
              </Button>
              {existing && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20"
                  onClick={() => void handleRemove()}
                  disabled={remove.isPending}
                  data-testid="price-alert-remove"
                >
                  Remover
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
