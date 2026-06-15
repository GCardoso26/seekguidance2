"use client";

import { Check, X } from "lucide-react";
import { COMPARISON_ROWS } from "@/lib/pricing-plans";

type Props = {
  isAnnual: boolean;
};

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check size={18} className="mx-auto text-luxury-gold-light" aria-label="Incluído" />
    ) : (
      <X size={18} className="mx-auto text-luxury-mist/50" aria-label="Não incluído" />
    );
  }
  return <span className="text-sm text-luxury-frost/90">{value}</span>;
}

export function FeatureComparisonTable({ isAnnual }: Props) {
  return (
    <section className="luxury-page py-16">
      <h2 className="mb-8 text-center text-3xl font-light text-luxury-frost">Comparativo de recursos</h2>
      {isAnnual && (
        <p className="mb-6 text-center text-sm text-luxury-gold-light">
          Preços anuais com 20% de desconto aplicado nos planos pagos.
        </p>
      )}
      <div className="mx-auto max-w-5xl overflow-x-auto rounded-2xl border border-white/10 bg-luxury-midnight/60">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-sm uppercase tracking-wide text-luxury-mist">
              <th className="p-4 font-semibold">Recurso</th>
              <th className="p-4 text-center font-semibold text-luxury-gold-light">Casual</th>
              <th className="p-4 text-center font-semibold text-luxury-gold">Spike</th>
              <th className="p-4 text-center font-semibold text-violet-400">Equipe</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-white/10 last:border-0">
                <td className="p-4 text-sm font-medium text-luxury-frost">{row.feature}</td>
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
