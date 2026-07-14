import Link from "next/link";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CardImage } from "@/components/ui/CardImage";
import { formatCurrency } from "@/lib/format-currency";

export interface PriceTrendItem {
  cardId: string;
  name: string;
  setName: string;
  imageUrl?: string | null;
  price?: number;
  currency?: string;
  change7d: number;
  href?: string;
}

interface PriceTrendCardProps {
  trend: PriceTrendItem;
}

export function PriceTrendCard({ trend }: PriceTrendCardProps) {
  const up = trend.change7d >= 0;
  const href = trend.href ?? `/loja/cartas/${trend.cardId}`;

  return (
    <Card className="border-border/60 bg-card/50 transition hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-4">
        <div className="relative mb-3 aspect-[63/88] overflow-hidden rounded-md bg-muted/40">
          <CardImage
            src={trend.imageUrl ?? undefined}
            alt={trend.name}
            fill
            className="object-cover"
            sizes="200px"
            listQuality
          />
        </div>
        <p className="truncate font-medium">{trend.name}</p>
        <p className="truncate text-xs text-muted-foreground">{trend.setName}</p>
        {trend.price !== undefined && (
          <p className="mt-1 text-sm font-semibold text-success">
            {formatCurrency(trend.price, trend.currency ?? "BRL")}
          </p>
        )}
        <div
          className={`mt-2 flex items-center gap-1 text-sm font-medium ${
            up ? "text-success" : "text-danger"
          }`}
        >
          {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {up ? "+" : ""}
          {trend.change7d.toFixed(1)}% (7d)
        </div>
        <Link href={href} className="mt-2 inline-block text-xs text-primary hover:underline">
          Ver detalhes →
        </Link>
      </CardContent>
    </Card>
  );
}
