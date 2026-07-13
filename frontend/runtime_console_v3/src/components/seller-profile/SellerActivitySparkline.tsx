"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SellerSparklinePoint } from "@/lib/seller-analytics-query";

type Props = {
  data: SellerSparklinePoint[];
};

export function SellerActivitySparkline({ data }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground">
        Sem vendas recentes
      </div>
    );
  }

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="sellerSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0066FF" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ fontSize: 12 }}
            formatter={(value: number) => [`${value} vendas`, ""]}
            labelFormatter={(label: string | number) => String(label)}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#0066FF"
            fill="url(#sellerSpark)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
