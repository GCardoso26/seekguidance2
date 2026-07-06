"use client";

import Link from "next/link";
import Image from "next/image";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format-currency";
import type { PriceAlert } from "@/types/alert";
import { useDeletePriceAlert } from "@/hooks/usePriceAlerts";

const STATUS_LABELS: Record<string, string> = {
  active: "Ativo",
  triggered: "Disparado",
  disabled: "Pausado",
  expired: "Expirado",
};

interface AlertCardProps {
  alert: PriceAlert;
}

export function AlertCard({ alert }: AlertCardProps) {
  const remove = useDeletePriceAlert();
  const imageSrc = alert.cardImageUrl || "/logos/default-tcg.svg";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <Link href={`/loja/cartas/${alert.cardId}`} className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="44px"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/loja/cartas/${alert.cardId}`} className="font-medium hover:underline">
            {alert.cardName}
          </Link>
          <p className="text-xs text-muted-foreground">{alert.setName}</p>
          <p className="mt-1 text-sm">
            Alerta quando{" "}
            {alert.condition === "below" ? "baixar para" : "subir para"}{" "}
            <strong>{formatCurrency(alert.targetPrice, "BRL")}</strong>
          </p>
          {alert.targetCondition && (
            <ConditionBadge condition={alert.targetCondition as CardCondition} size="sm" />
          )}
          {alert.currentPrice != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Preço atual: {formatCurrency(alert.currentPrice, "BRL")}
              {alert.priceDifference != null && ` (${alert.priceDifference > 0 ? "+" : ""}${alert.priceDifference}%)`}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              alert.status === "triggered"
                ? "bg-green-500/10 text-green-600"
                : alert.status === "active"
                  ? "bg-blue-500/10 text-blue-600"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {STATUS_LABELS[alert.status] || alert.status}
          </span>
          {alert.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(alert.id)}
            >
              Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
