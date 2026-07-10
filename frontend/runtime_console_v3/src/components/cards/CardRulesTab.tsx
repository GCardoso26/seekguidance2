"use client";

import Link from "next/link";
import type { UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";

interface CardRulesTabProps {
  card: UnifiedCard;
  cardId: string;
}

export function CardRulesTab({ card, cardId }: CardRulesTabProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <h3 className="font-semibold text-amber-800 dark:text-warning">Diferencial Judge-TCG</h3>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
          Rulings oficiais e interpretações para esta carta — integrado ao fluxo de compra.
        </p>
      </div>

      {card.oracleText ? (
        <div>
          <h4 className="mb-2 font-semibold">Oracle Text</h4>
          <p className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-relaxed">{card.oracleText}</p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Texto de regras não disponível para esta carta.</p>
      )}

      {card.legalities && Object.keys(card.legalities).length > 0 && (
        <div>
          <h4 className="mb-2 font-semibold">Legalidades por formato</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Object.entries(card.legalities).map(([format, status]) => (
              <div
                key={format}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-medium capitalize",
                  status === "legal" && "bg-green-500/10 text-green-600",
                  status === "banned" && "bg-red-500/10 text-red-600",
                  status !== "legal" && status !== "banned" && "bg-muted text-muted-foreground",
                )}
              >
                {format}: {status === "not_legal" ? "não legal" : status}
              </div>
            ))}
          </div>
        </div>
      )}

      <Link href={`/regras/carta/${cardId}`} className="inline-flex text-sm text-primary hover:underline">
        Ver página completa de regras →
      </Link>
    </div>
  );
}
