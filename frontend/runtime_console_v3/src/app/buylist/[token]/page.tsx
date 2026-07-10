"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PublicBuylistPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["public-buylist", token],
    queryFn: async () => {
      const res = await fetch(`/api/buylist/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("not_found");
      return res.json() as Promise<{ buylist: Record<string, unknown> }>;
    },
  });

  const buylist = data?.buylist;
  const items = (buylist?.items ?? []) as Array<Record<string, unknown>>;

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/buylist/${encodeURIComponent(token)}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (res.status === 401) {
        window.location.href = `/login?next=/buylist/${token}`;
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(String((err as { detail?: string }).detail ?? "Erro ao enviar"));
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileLayout>
      <main className="mx-auto max-w-2xl space-y-6 p-4">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando oferta…</p>
        ) : !buylist ? (
          <p className="text-muted-foreground">Oferta não encontrada.</p>
        ) : (
          <>
            <div>
              <p className="text-sm text-muted-foreground">{String(buylist.store_name)}</p>
              <h1 className="text-2xl font-bold">{String(buylist.title)}</h1>
              <p className="mt-2 text-primary text-lg font-semibold">
                Total estimado: {formatBRL(Number(buylist.total_offer_cents ?? 0))}
              </p>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="p-3">Carta</th>
                    <th className="p-3">Qtd</th>
                    <th className="p-3">Oferta</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={String(item.id)} className="border-t border-border">
                      <td className="p-3">{String(item.card_name)}</td>
                      <td className="p-3">{String(item.quantity)}</td>
                      <td className="p-3">{formatBRL(Number(item.offer_cents ?? 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {submitted ? (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm">
                Proposta enviada! A loja entrará em contato para concluir a venda com Compra Protegida.
              </p>
            ) : (
              <div className="space-y-3">
                <textarea
                  className="w-full rounded-lg border border-border bg-black/30 p-3 text-sm"
                  placeholder="Mensagem opcional (condição das cartas, etc.)"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button className="w-full" disabled={loading} onClick={() => void handleSubmit()}>
                  {loading ? "Enviando…" : "Aceitar oferta e vender minha coleção"}
                </Button>
                {error && <p className="text-sm text-red-300">{error}</p>}
                <p className="text-xs text-muted-foreground">
                  Precisa estar logado. Após aceite, a loja confirma e o pagamento pode usar escrow.
                </p>
              </div>
            )}

            {buylist.store_slug && (
              <Link href={`/marketplace/loja/${String(buylist.store_slug)}`} className="text-sm text-primary underline">
                Ver loja
              </Link>
            )}
          </>
        )}
      </main>
    </MobileLayout>
  );
}
