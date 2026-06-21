"use client";

import { useState } from "react";

type Props = {
  copyPayload: string;
  qrCode: string | null;
  txid: string;
};

export function PixShareActions({ copyPayload, qrCode, txid }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(copyPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "PIX Judge TCG", text: copyPayload });
    } else {
      await copy();
    }
  }

  function downloadQr() {
    if (!qrCode) return;
    const a = document.createElement("a");
    a.href = qrCode;
    a.download = `pix-${txid}.png`;
    a.click();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => void copy()} className="flex-1 rounded-lg border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">
        {copied ? "Copiado!" : "Copiar PIX"}
      </button>
      <button type="button" onClick={() => void share()} className="flex-1 rounded-lg border border-white/20 px-3 py-2 text-sm">
        Compartilhar
      </button>
      {qrCode && (
        <button type="button" onClick={downloadQr} className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm">
          Baixar QR Code
        </button>
      )}
    </div>
  );
}
