"use client";

import { useState } from "react";
import { formatShopPrice } from "@/lib/marketplace-shop";

type PixData = {
  txid: string;
  copy_payload: string;
  qr_code: string | null;
  amount_cents: number;
  expires_at: string;
  pix_key: string;
  store_name: string;
};

type Props = {
  pix: PixData;
};

export function PixCheckoutPanel({ pix }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyPayload() {
    await navigator.clipboard.writeText(pix.copy_payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">
        Pagamento PIX para <strong>{pix.store_name}</strong> — {formatShopPrice(pix.amount_cents)}
      </p>
      {pix.qr_code && (
        <div className="inline-block rounded-xl bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pix.qr_code} alt="QR Code PIX" width={220} height={220} />
        </div>
      )}
      <p className="text-xs text-muted-foreground">Identificador: {pix.txid}</p>
      <div className="surface-card rounded-lg p-3 text-left text-xs whitespace-pre-wrap break-all">
        {pix.copy_payload}
      </div>
      <button
        type="button"
        onClick={() => void copyPayload()}
        className="w-full rounded-lg border border-emerald-500/40 px-4 py-2 text-emerald-200"
      >
        {copied ? "Copiado!" : "Copiar dados PIX"}
      </button>
      <p className="text-xs text-muted-foreground">
        Após pagar, o lojista confirma o recebimento. Expira às {new Date(pix.expires_at).toLocaleTimeString("pt-BR")}.
      </p>
    </div>
  );
}
