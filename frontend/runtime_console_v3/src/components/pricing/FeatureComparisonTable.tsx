"use client";

import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "@/lib/pricing-plans";

type Props = {
  isAnnual: boolean;
};

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check size={18} className="mx-auto text-primary-light" aria-label="Incluído" />
    ) : (
      <X size={18} className="mx-auto text-muted-foreground/50" aria-label="Não incluído" />
    );
  }
  return <span className="text-sm text-foreground/90">{value}</span>;
}

export function FeatureComparisonTable({ isAnnual }: Props) {
  return (
    <section className="luxury-page py-16">
      <h2 className="mb-8 text-center text-3xl font-light text-foreground">Comparativo de recursos</h2>
      {isAnnual && (
        <p className="mb-6 text-center text-sm text-primary-light">
          Preços anuais com 20% de desconto aplicado nos planos pagos.
        </p>
      )}
      <div className="mx-auto max-w-5xl overflow-x-auto rounded-2xl border border-border bg-muted/60">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-border text-sm uppercase tracking-wide text-muted-foreground">
              <th className="p-4 font-semibold">Recurso</th>
              <th className="p-4 text-center font-semibold text-primary-light">Casual</th>
              <th className="p-4 text-center font-semibold text-primary">Spike</th>
              <th className="p-4 text-center font-semibold text-violet-400">Equipe</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-border last:border-0">
                <td className="p-4 text-sm font-medium text-foreground">{row.feature}</td>
                <td className="p-4 text-center">
                  <CellValue value={row.free} />
                </td>
                <td className="p-4 text-center">
                  <CellValue value={row.pro} />
                </td>
                <td className="p-4 text-center">
                  <CellValue value={row.team} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
