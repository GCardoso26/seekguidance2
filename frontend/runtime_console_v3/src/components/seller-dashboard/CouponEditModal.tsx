"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  couponFormToApiPayload,
  couponFromApiRow,
  sellerCouponFormSchema,
  type SellerCouponFormValues,
} from "@/lib/seller-coupon-form";
import type { SellerCouponRow } from "@/types/seller-coupon";

type Props = {
  storeId: string;
  coupon: SellerCouponRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-danger">{message}</p>;
}

export function CouponEditModal({ storeId, coupon, open, onOpenChange, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SellerCouponFormValues>({
    resolver: zodResolver(sellerCouponFormSchema),
    defaultValues: couponFromApiRow({
      code: coupon.code,
      type: coupon.discountType,
      value_cents: coupon.valueCents,
      min_order_cents: coupon.minOrderCents,
      max_uses: coupon.maxUses,
      expires_at: coupon.expiresAt,
      is_active: coupon.isActive,
    }),
  });

  const discountType = watch("discount_type");

  useEffect(() => {
    reset(
      couponFromApiRow({
        code: coupon.code,
        type: coupon.discountType,
        value_cents: coupon.valueCents,
        min_order_cents: coupon.minOrderCents,
        max_uses: coupon.maxUses,
        expires_at: coupon.expiresAt,
        is_active: coupon.isActive,
      }),
    );
  }, [coupon, reset]);

  async function onSubmit(values: SellerCouponFormValues) {
    try {
      const payload = couponFormToApiPayload({ ...values, code: coupon.code });
      const res = await fetch(
        `/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(coupon.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((data as { detail?: string }).detail ?? "Erro ao salvar cupom"));
      }
      toast.success("Cupom atualizado");
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar cupom");
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(100vw-2rem,32rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-background p-6 shadow-xl"
          data-testid="coupon-edit-modal"
        >
          <Dialog.Title className="text-lg font-semibold text-foreground">Editar cupom</Dialog.Title>
          <p className="mt-1 font-mono text-sm text-primary">{coupon.code}</p>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-coupon-type" className="text-sm text-muted-foreground">
                  Tipo
                </label>
                <select
                  id="edit-coupon-type"
                  className="mt-1 w-full rounded-lg border border-border bg-foreground/30 px-3 py-2 text-sm"
                  {...register("discount_type")}
                >
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor fixo (centavos)</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-coupon-value" className="text-sm text-muted-foreground">
                  {discountType === "percentage" ? "Desconto (%)" : "Desconto (centavos)"}
                </label>
                <Input
                  id="edit-coupon-value"
                  type="number"
                  step="0.01"
                  min={0.01}
                  className="mt-1 border-border bg-foreground/30"
                  {...register("discount_value")}
                />
                <FieldError message={errors.discount_value?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-coupon-max-uses" className="text-sm text-muted-foreground">
                  Uso máximo
                </label>
                <Input
                  id="edit-coupon-max-uses"
                  type="number"
                  min={1}
                  className="mt-1 border-border bg-foreground/30"
                  {...register("max_uses")}
                />
                <FieldError message={errors.max_uses?.message} />
              </div>
              <div>
                <label htmlFor="edit-coupon-expires" className="text-sm text-muted-foreground">
                  Validade
                </label>
                <Input
                  id="edit-coupon-expires"
                  type="date"
                  className="mt-1 border-border bg-foreground/30"
                  {...register("expires_at")}
                />
                <FieldError message={errors.expires_at?.message} />
              </div>
            </div>

            <div>
              <label htmlFor="edit-coupon-min-order" className="text-sm text-muted-foreground">
                Pedido mínimo (R$)
              </label>
              <Input
                id="edit-coupon-min-order"
                type="number"
                step="0.01"
                min={0}
                className="mt-1 border-border bg-foreground/30"
                {...register("min_order_value")}
              />
              <FieldError message={errors.min_order_value?.message} />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" className="rounded" {...register("is_active")} />
              Cupom ativo
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando…" : "Salvar"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
