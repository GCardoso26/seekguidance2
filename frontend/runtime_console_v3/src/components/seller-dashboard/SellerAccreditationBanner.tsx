"use client";

import Link from "next/link";
import { useSellerStore } from "@/hooks/useSellerStore";

function daysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Banner de regularização para lojas grandfathered / free / sem CNPJ (ADR-018). */
export function SellerAccreditationBanner() {
  const { dashboard, hasStore } = useSellerStore();
  if (!hasStore || !dashboard?.store) return null;

  const store = dashboard.store as Record<string, unknown>;
  const status = String(store.accreditation_status ?? "");
  const plan = String(store.subscription_plan ?? "");
  const cnpj = String(store.cnpj ?? "").trim();
  const deadline = store.accreditation_deadline_at
    ? String(store.accreditation_deadline_at)
    : null;
  const remaining = daysLeft(deadline);

  const needsAttention =
    status === "grandfathered" ||
    status === "pending" ||
    plan === "free" ||
    plan === "pending_accreditation" ||
    !cnpj;

  if (!needsAttention) return null;

  const expired = status === "grandfathered" && remaining !== null && remaining < 0;

  return (
    <div
      role="status"
      className={`mx-4 mt-4 rounded-lg border px-4 py-3 text-sm sm:mx-6 ${
        expired
          ? "border-danger/40 bg-danger/10 text-foreground"
          : "border-warning/40 bg-warning/10 text-foreground"
      }`}
    >
      <p className="font-medium">
        {expired
          ? "Prazo de regularização encerrado"
          : status === "pending" || plan === "pending_accreditation"
            ? "Credenciamento em andamento"
            : "Regularize sua loja (CNPJ + plano pago)"}
      </p>
      <p className="mt-1 text-muted-foreground">
        {expired
          ? "Novas publicações ficam bloqueadas até informar CNPJ válido e concluir o credenciamento / plano Lojista+."
          : status === "pending" || plan === "pending_accreditation"
            ? "Sua loja ainda não pode publicar ofertas. Acompanhe a análise ou complete o pedido em /vender."
            : `Hobby stores precisam de CNPJ e plano pago. ${
                remaining != null && remaining >= 0
                  ? `Prazo restante: ${remaining} dia(s).`
                  : "Verifique o prazo no painel ops."
              }`}
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Link href="/vender" className="text-primary underline">
          Credenciamento
        </Link>
        <Link href="/vendedor/painel/planos" className="text-primary underline">
          Planos
        </Link>
      </div>
    </div>
  );
}
