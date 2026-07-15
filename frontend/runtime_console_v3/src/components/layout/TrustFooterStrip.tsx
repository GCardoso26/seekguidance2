import Link from "next/link";
import { brand, brandCnpjIsPlaceholder, brandHasLegalTransparency } from "@/lib/brand";

/** Faixa de confiança — BP 5.2 Trust Engineering. */
export function TrustFooterStrip() {
  const ok = brandHasLegalTransparency();
  const placeholderCnpj = brandCnpjIsPlaceholder() && Boolean(brand.cnpj.trim());

  return (
    <footer
      className="border-t border-border bg-muted/40 px-4 py-8 text-small text-foreground"
      data-testid="trust-footer"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div>
            <p className="font-semibold">{brand.legalName}</p>
            <p className="mt-1 text-muted-foreground">
              {brand.cnpj
                ? `CNPJ ${brand.cnpj}`
                : "CNPJ ainda não publicado nesta página."}
            </p>
            <p className="mt-1 text-muted-foreground">
              {brand.legalAddress
                ? brand.legalAddress
                : "Endereço comercial ainda não publicado."}
            </p>
            <p className="mt-1">
              Contato:{" "}
              <a className="text-primary underline" href={`mailto:${brand.supportEmail}`}>
                {brand.supportEmail}
              </a>
            </p>
            {!ok && (
              <p className="mt-2 font-medium text-warning" role="status">
                {placeholderCnpj
                  ? "CNPJ placeholder (zeros) — troque pelo CNPJ real da empresa antes de compras de alto valor."
                  : "Transparência legal incompleta — não trate esta página como pronta para compra de alto valor."}
              </p>
            )}
          </div>
          <nav className="flex flex-col gap-2 sm:items-end" aria-label="Informações legais">
            <Link href="/termos" className="text-primary underline">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="text-primary underline">
              Privacidade (LGPD)
            </Link>
            <Link href="/politicas/compra" className="text-primary underline">
              Política de compra
            </Link>
            <Link href="/politicas/cancelamento" className="text-primary underline">
              Cancelamento
            </Link>
            <Link href="/politicas/reembolso" className="text-primary underline">
              Reembolso
            </Link>
            <Link href="/politicas/marketplace" className="text-primary underline">
              Regras da loja
            </Link>
            <Link href="/suporte" className="text-primary underline">
              Ajuda
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
