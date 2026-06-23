"use client";

import Link from "next/link";
import { useState } from "react";
import { ProCheckout } from "@/components/store/ProCheckout";
import { ProBadge } from "@/components/store/ProBadge";

const PRO_FEATURES = [
  "Produtos ilimitados no marketplace",
  "Torneios sem limite de jogadores",
  "Analytics avançado",
  "Suporte prioritário",
  "Zero comissão sobre vendas (PIX direto)",
];

type Props = {
  storeId: string;
  plan?: string;
  onSubscribed?: () => void;
};

export function ProUpgradePanel({ storeId, plan, onSubscribed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = plan ?? "free";

  if (current === "pro" || current === "enterprise") {
    return (
      <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-6">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">Plano {current === "enterprise" ? "Enterprise" : "Pro Loja"}</h2>
          <ProBadge plan={current} />
        </div>
        <p className="mt-2 text-sm text-luxury-mist">Assinatura ativa. Obrigado por apoiar a Judge TCG!</p>
      </div>
    );
  }

  async function subscribe(target: "pro" | "enterprise") {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(String(data.detail ?? "Falha ao assinar"));
      onSubscribed?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao assinar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="font-semibold">Pro Loja</h2>
      <p className="mt-1 text-sm text-luxury-mist">R$ 49/mês — receita da plataforma via assinatura, não comissão.</p>
      <ul className="mt-4 space-y-2">
        {PRO_FEATURES.map((f) => (
          <li key={f} className="text-sm text-luxury-mist">✓ {f}</li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/vendedor/painel/pro" className="rounded-lg bg-luxury-gold px-4 py-2 font-semibold text-luxury-onyx">
          Ver planos Pro
        </Link>
        <button
          type="button"
          disabled={loading}
          onClick={() => void subscribe("pro")}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm disabled:opacity-50"
        >
          Ativar dev (sem pagamento)
        </button>
      </div>
      <div className="mt-6 border-t border-white/10 pt-6">
        <ProCheckout storeId={storeId} onSuccess={onSubscribed} />
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </div>
  );
}
