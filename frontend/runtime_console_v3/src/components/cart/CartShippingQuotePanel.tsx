"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { entrarPath } from "@/lib/auth/entrar-path";
import { formatCepDisplay, readSavedBuyerCep, saveBuyerCep } from "@/lib/buyer-cep";
import { formatShopPrice } from "@/lib/marketplace-shop";

type ShippingQuoteRow = {
  id?: string;
  service?: string;
  carrier?: string;
  price_cents?: number;
  delivery_days?: number;
  pickup_available?: boolean;
};

type QuoteResponse = {
  quotes?: ShippingQuoteRow[];
  destination_postal_code?: string;
  detail?: string;
};

/**
 * BP 5.2 — usa GET /api/buyer/shipping/quote (já existente).
 * Pré-preenche CEP salvo na PDP; não inventa valores se a API falhar.
 */
export function CartShippingQuotePanel({ className }: { className?: string }) {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needLogin, setNeedLogin] = useState(false);
  const [quotes, setQuotes] = useState<ShippingQuoteRow[]>([]);

  useEffect(() => {
    const saved = readSavedBuyerCep();
    if (saved) setCep(formatCepDisplay(saved));
  }, []);

  const quote = useCallback(async (digits: string) => {
    if (digits.length !== 8) {
      setError("Informe um CEP com 8 dígitos.");
      setQuotes([]);
      return;
    }
    saveBuyerCep(digits);
    setLoading(true);
    setError(null);
    setNeedLogin(false);
    try {
      const res = await fetch(
        `/api/buyer/shipping/quote?destination_postal_code=${encodeURIComponent(digits)}`,
        { cache: "no-store" },
      );
      if (res.status === 401) {
        setNeedLogin(true);
        setQuotes([]);
        setError(null);
        return;
      }
      const data = (await res.json()) as QuoteResponse;
      if (!res.ok) {
        setQuotes([]);
        setError(typeof data.detail === "string" ? data.detail : "Não foi possível cotar o frete agora.");
        return;
      }
      const list = Array.isArray(data.quotes) ? data.quotes : [];
      setQuotes(list);
      if (list.length === 0) {
        setError(
          "Nenhuma cotação para este CEP com o carrinho atual. Confira o estoque ou tente outro CEP.",
        );
      }
    } catch {
      setQuotes([]);
      setError("Falha de rede ao cotar frete. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = readSavedBuyerCep();
    if (saved.length === 8) void quote(saved);
    // Autoload once from PDP CEP only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={className}
      data-testid="cart-shipping-quote"
      aria-labelledby="cart-shipping-title"
    >
      <h2 id="cart-shipping-title" className="text-small font-semibold text-foreground">
        Frete para o seu CEP
      </h2>
      <p className="mt-1 text-caption text-muted-foreground">
        Valores oficiais da loja (sem estimativa inventada). Se você salvou o CEP na página do
        produto, ele já vem preenchido.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCepDisplay(e.target.value))}
          className="min-h-11 flex-1 rounded-md border border-border bg-background px-3 text-body tabular-nums"
          aria-label="CEP de entrega"
        />
        <Button
          type="button"
          className="min-h-11 shrink-0"
          disabled={loading}
          onClick={() => void quote(cep.replace(/\D/g, ""))}
        >
          {loading ? "Calculando…" : "Calcular frete"}
        </Button>
      </div>

      {needLogin && (
        <p className="mt-3 text-small text-muted-foreground" role="status">
          Entre na conta para ver frete e prazo deste CEP com os itens do carrinho.{" "}
          <Link href={entrarPath("/carrinho")} className="text-primary underline">
            Entrar
          </Link>
        </p>
      )}

      {error && !needLogin && (
        <p className="mt-3 text-small text-warning" role="alert">
          {error}
        </p>
      )}

      {quotes.length > 0 && (
        <ul className="mt-3 space-y-2" data-testid="cart-shipping-quotes-list">
          {quotes.map((q, i) => (
            <li
              key={q.id ?? `${q.service}-${i}`}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-small"
            >
              <span className="min-w-0">
                <span className="font-medium text-foreground">{q.service ?? "Opção"}</span>
                {typeof q.delivery_days === "number" && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {q.delivery_days === 0 ? "Retirada" : `~${q.delivery_days} dia(s)`}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono font-semibold tabular-nums">
                {typeof q.price_cents === "number" ? formatShopPrice(q.price_cents) : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
