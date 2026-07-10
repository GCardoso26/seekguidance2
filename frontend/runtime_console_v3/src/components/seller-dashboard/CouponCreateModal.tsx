"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  couponFormToApiPayload,
  randomCouponCode,
  sellerCouponFormSchema,
  type SellerCouponFormValues,
} from "@/lib/seller-coupon-form";

type Props = {
  storeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

const emptyValues: SellerCouponFormValues = {
  code: randomCouponCode(),
  discount_type: "percentage",
  discount_value: 10,
  max_uses: "",
  expires_at: "",
  min_order_value: 0,
  is_active: true,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

export function CouponCreateModal({ storeId, open, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SellerCouponFormValues>({
    resolver: zodResolver(sellerCouponFormSchema),
    defaultValues: emptyValues,
  });

  const discountType = watch("discount_type");

  async function onSubmit(values: SellerCouponFormValues) {
    try {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couponFormToApiPayload(values)),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Erro ao criar cupom"));
      }
      toast.success("Cupom criado");
      reset({ ...emptyValues, code: randomCouponCode() });
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar cupom");
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) reset({ ...emptyValues, code: randomCouponCode() });
        onOpenChange(next);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
          data-testid="coupon-create-modal"
        >
          <Dialog.Title className="text-lg font-semibold text-white">Novo cupom</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <div>
              <label htmlFor="coupon-code" className="text-sm text-muted-foreground">
                Código
              </label>
              <div className="mt-1 flex gap-2">
                <Input
                  id="coupon-code"
                  className="border-border bg-black/30 font-mono uppercase"
                  data-testid="coupon-code-input"
                  {...register("code")}
                  onChange={(e) => setValue("code", e.target.value.toUpperCase())}
                />
                <Button type="button" variant="outline" onClick={() => setValue("code", randomCouponCode())}>
                  Gerar
                </Button>
              </div>
              <FieldError message={errors.code?.message} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="coupon-type" className="text-sm text-muted-foreground">
                  Tipo
                </label>
                <select
                  id="coupon-type"
                  className="mt-1 w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm"
                  data-testid="coupon-type-select"
                  {...register("discount_type")}
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (centavos)</option>
                </select>
              </div>
              <div>
                <label htmlFor="coupon-value" className="text-sm text-muted-foreground">
                  {discountType === "percentage" ? "Desconto (%)" : "Desconto (centavos)"}
                </label>
                <Input
                  id="coupon-value"
                  type="number"
                  step="0.01"
                  min={0.01}
                  className="mt-1 border-border bg-black/30"
                  data-testid="coupon-value-input"
                  {...register("discount_value")}
                />
                <FieldError message={errors.discount_value?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="coupon-max-uses" className="text-sm text-muted-foreground">
                  Uso máximo (vazio = ilimitado)
                </label>
                <Input
                  id="coupon-max-uses"
                  type="number"
                  min={1}
                  className="mt-1 border-border bg-black/30"
                  data-testid="coupon-max-uses-input"
                  {...register("max_uses")}
                />
                <FieldError message={errors.max_uses?.message} />
              </div>
              <div>
                <label htmlFor="coupon-expires" className="text-sm text-muted-foreground">
                  Validade (opcional)
                </label>
                <Input
                  id="coupon-expires"
                  type="date"
                  className="mt-1 border-border bg-black/30"
                  data-testid="coupon-expires-input"
                  {...register("expires_at")}
                />
                <FieldError message={errors.expires_at?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="coupon-min-order" className="text-sm text-muted-foreground">
                Pedido mínimo (R$)
              </label>
              <Input
                id="coupon-min-order"
                type="number"
                step="0.01"
                min={0}
                className="mt-1 border-border bg-black/30"
                {...register("min_order_value")}
              />
              <FieldError message={errors.min_order_value?.message} />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="rounded" {...register("is_active")} />
              Ativo ao criar
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting} data-testid="coupon-submit-btn">
                {isSubmitting ? "Criando…" : "Criar cupom"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
