"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Bell } from "lucide-react";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { usePriceAlertGate, usePriceAlertForProduct } from "@/hooks/useWishlistPriceAlerts";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import type { ShopProduct } from "@/lib/marketplace-shop";
import { cn } from "@/lib/utils";

const PriceAlertModal = dynamic(
  () => import("@/components/marketplace/PriceAlertModal").then((m) => m.PriceAlertModal),
  { ssr: false },
);

type Props = {
  productId: string;
  product?: ShopProduct;
  className?: string;
  size?: "sm" | "md";
};

export function PriceAlertButton({ productId, product, className, size = "md" }: Props) {
  const [open, setOpen] = useState(false);
  const [cpfOpen, setCpfOpen] = useState(false);
  const requireAuth = usePriceAlertGate();
  const { data: accountStatus } = useAccountStatus();
  const existing = usePriceAlertForProduct(productId);

  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const pad = size === "sm" ? "p-1.5" : "p-2";
  const baseline = product?.price_cents ?? 0;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireAuth()) return;
    if (needsCpfCompletion(accountStatus)) {
      setCpfOpen(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={existing ? "Editar alerta de preço" : "Criar alerta de preço"}
        aria-pressed={Boolean(existing)}
        data-testid={`price-alert-button-${productId}`}
        className={cn(
          "relative rounded-full border border-border bg-card/90 text-foreground shadow-xs backdrop-blur transition-colors hover:border-info/50 hover:text-info focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          pad,
          existing && "border-info/50 bg-info/10 text-info",
          className,
        )}
      >
        <Bell className={cn(iconSize, existing && "fill-current")} />
        {existing && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-info" />
        )}
      </button>
      {open && (
        <PriceAlertModal
          productId={productId}
          product={product}
          baselinePriceCents={baseline}
          open={open}
          onOpenChange={setOpen}
        />
      )}
      <CpfCheckoutModal open={cpfOpen} onClose={() => setCpfOpen(false)} />
    </>
  );
}
