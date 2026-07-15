"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { brand, brandCnpjIsPlaceholder, brandHasLegalTransparency } from "@/lib/brand";
import { formatCepDisplay, readSavedBuyerCep, saveBuyerCep } from "@/lib/buyer-cep";

/**
 * BP 5.2 — CEP na PDP sem inventar preço.
 * Persiste CEP e deixa claro que o frete oficial sai no carrinho (API existente).
 */
export function PdpShippingCepField({ className }: { className?: string }) {
  const [cep, setCep] = useState("");
  const [saved, setSaved] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    const existing = readSavedBuyerCep();
    if (existing) {
      setCep(formatCepDisplay(existing));
      setSaved(true);
    }
  }, []);

  const onSave = useCallback(() => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setHint("Informe um CEP com 8 dígitos.");
      setSaved(false);
      return;
    }
    saveBuyerCep(digits);
    setCep(formatCepDisplay(digits));
    setSaved(true);
    setHint("CEP salvo. Ao comprar, o frete e o prazo desta região aparecem no carrinho.");
  }, [cep]);

  return (
    <div className={className} data-testid="pdp-shipping-cep">
      <label className="block text-caption font-semibold text-foreground" htmlFor="pdp-cep">
        Frete (CEP)
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="pdp-cep"
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => {
            setSaved(false);
            setHint(null);
            setCep(formatCepDisplay(e.target.value));
          }}
          className="min-h-10 flex-1 rounded-md border border-border bg-background px-3 text-body tabular-nums"
          aria-describedby="pdp-cep-hint"
        />
        <Button type="button" variant="outline" className="min-h-10 shrink-0" onClick={onSave}>
          Salvar
        </Button>
      </div>
      <p id="pdp-cep-hint" className="mt-1 text-caption text-muted-foreground" role="status">
        {hint ??
          (saved
            ? "CEP no carrinho — frete oficial da loja após Comprar."
            : "Sem frete inventado; cotação oficial no carrinho.")}
      </p>
    </div>
  );
}

function formatCnpjDisplay(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  if (d.length !== 14) return raw.trim();
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * BP 5.2 ATF — linha legal logo sob o preço (razão social + CNPJ).
 * Endereço completo fica no bloco de assurance / rodapé.
 */
export function PdpLegalAtfLine({ className }: { className?: string }) {
  const ok = brandHasLegalTransparency();
  const placeholder = brandCnpjIsPlaceholder() && Boolean(brand.cnpj.trim());
  return (
    <p
      className={className}
      data-testid="pdp-legal-atf"
      data-legal-ready={ok ? "true" : "false"}
    >
      {ok ? (
        <span className="text-caption text-muted-foreground">
          <span className="font-medium text-foreground">{brand.legalName}</span>
          {" · CNPJ "}
          <span className="tabular-nums">{formatCnpjDisplay(brand.cnpj)}</span>
        </span>
      ) : placeholder ? (
        <span className="text-caption font-medium text-warning" role="status">
          CNPJ publicado é placeholder — use o CNPJ real da empresa antes de compras de alto valor.
        </span>
      ) : (
        <span className="text-caption font-medium text-warning" role="status">
          Transparência legal incompleta — publique CNPJ e endereço reais antes de compras de alto
          valor.
        </span>
      )}
    </p>
  );
}

/**
 * Políticas + responsabilidade plataforma vs loja (logo acima do Comprar).
 * CNPJ já está no ATF quando o gate passa — aqui só endereço + políticas.
 */
export function PdpPurchaseAssurance() {
  const ok = brandHasLegalTransparency();
  return (
    <div
      className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-2.5 text-small"
      data-testid="pdp-purchase-assurance"
    >
      <p className="font-semibold text-foreground">Compra nesta plataforma</p>
      {ok ? (
        brand.legalAddress ? (
          <p className="text-muted-foreground">{brand.legalAddress}</p>
        ) : null
      ) : (
        <p className="font-medium text-warning">
          Dados fiscais incompletos nesta instância — não use para compras de alto valor até
          publicá-los.
        </p>
      )}
      <p className="text-muted-foreground">
        A loja vendedora envia o pedido. Com Compra protegida ativa no pagamento, o valor fica
        retido até a confirmação de recebimento; o vendedor recebe depois.
      </p>
      <nav className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Políticas nesta compra">
        <Link href="/politicas/compra" className="text-primary underline">
          Política de compra
        </Link>
        <Link href="/politicas/reembolso" className="text-primary underline">
          Reembolso
        </Link>
        <Link href="/politicas/cancelamento" className="text-primary underline">
          Cancelamento
        </Link>
        <Link href="/suporte" className="text-primary underline">
          Ajuda
        </Link>
      </nav>
    </div>
  );
}
