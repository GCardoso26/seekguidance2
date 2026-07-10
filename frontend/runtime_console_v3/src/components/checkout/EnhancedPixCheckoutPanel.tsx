"use client";

import { PixCheckoutPanel as BasePanel } from "@/components/marketplace/PixCheckoutPanel";
import { PixTimer } from "@/components/checkout/PixTimer";
import { PixStatusRealtime } from "@/components/checkout/PixStatusRealtime";
import { PixShareActions } from "@/components/checkout/PixShareActions";
import { formatShopPrice } from "@/lib/marketplace-shop";

type PixData = {
  txid: string;
  copy_payload: string;
  qr_code: string | null;
  amount_cents: number;
  subtotal_cents?: number;
  discount_cents?: number;
  coupon_code?: string | null;
  expires_at: string;
  pix_key: string;
  store_name: string;
};

type Props = {
  pix: PixData;
  onRegenerate?: () => void;
  onManualConfirm?: () => void;
};

export function EnhancedPixCheckoutPanel({ pix, onRegenerate, onManualConfirm }: Props) {
  const subtotal = pix.subtotal_cents ?? pix.amount_cents;
  const discount = pix.discount_cents ?? 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2 surface-card rounded-lg p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatShopPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Desconto{pix.coupon_code ? ` (${pix.coupon_code})` : ""}</span>
            <span>−{formatShopPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total PIX</span>
          <span data-testid="pix-final-amount">{formatShopPrice(pix.amount_cents)}</span>
        </div>
      </div>

      <PixTimer expiresAt={pix.expires_at} onExpired={onRegenerate} />
      <PixStatusRealtime txid={pix.txid} />
      <div data-testid="pix-qr-code">
        <BasePanel pix={pix} />
      </div>
      <PixShareActions copyPayload={pix.copy_payload} qrCode={pix.qr_code} txid={pix.txid} />
      <details className="surface-card rounded-lg p-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium">Como pagar no app do banco</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-4">
          <li>Abra o app do seu banco</li>
          <li>Escolha PIX → Copia e cola ou QR Code</li>
          <li>Cole o código ou escaneie o QR</li>
          <li>Confirme o valor e finalize</li>
        </ol>
      </details>
      {onManualConfirm && (
        <button type="button" onClick={onManualConfirm} className="w-full text-sm text-muted-foreground underline">
          Já paguei — aguardar confirmação
        </button>
      )}
    </div>
  );
}
