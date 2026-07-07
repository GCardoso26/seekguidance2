"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { useSellerAiBrief } from "@/hooks/useSellerAiBrief";
import { formatShopPrice } from "@/lib/marketplace-shop";

export function SellerAiAssistantWidget() {
  const { data, isLoading } = useSellerAiBrief();

  if (isLoading) {
    return (
      <div
        className="rounded-xl border border-luxury-gold/20 bg-gradient-to-br from-luxury-gold/5 to-transparent p-4"
        data-testid="seller-ai-widget-skeleton"
      >
        <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <section
      className="rounded-xl border border-luxury-gold/25 bg-gradient-to-br from-luxury-gold/8 to-luxury-obsidian p-4"
      data-testid="seller-ai-assistant-widget"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-luxury-gold" aria-hidden />
          <h3 className="text-sm font-semibold text-luxury-frost">Assistente da Loja</h3>
        </div>
        <span className="rounded-full bg-luxury-gold/15 px-2 py-0.5 text-[10px] font-medium text-luxury-gold">
          {data.opportunity_count} oportunidades
        </span>
      </div>

      <p className="mt-2 line-clamp-3 whitespace-pre-line text-xs text-luxury-mist">{data.summary}</p>

      {data.metrics.revenue_today_cents != null && data.metrics.revenue_today_cents > 0 && (
        <p className="mt-2 text-xs text-luxury-frost">
          Receita hoje: <span className="font-medium text-emerald-400">{formatShopPrice(data.metrics.revenue_today_cents)}</span>
        </p>
      )}

      <ul className="mt-3 space-y-1.5">
        {data.top_insights.slice(0, 3).map((ins) => (
          <li key={ins.id}>
            <Link
              href={ins.cta_href}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"
            >
              <span className="truncate text-luxury-frost">{ins.title}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-luxury-mist" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/vendedor/painel/insights"
        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-luxury-gold hover:underline"
        data-testid="seller-ai-see-all"
      >
        Ver todas as recomendações
        <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
