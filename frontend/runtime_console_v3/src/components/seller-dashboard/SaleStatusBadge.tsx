const LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  disputed: "Disputa",
};

const COLORS: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-200",
  paid: "bg-emerald-500/20 text-emerald-200",
  processing: "bg-blue-500/20 text-blue-200",
  shipped: "bg-indigo-500/20 text-indigo-200",
  delivered: "bg-white/10 text-luxury-mist",
  cancelled: "bg-red-500/20 text-red-200",
  disputed: "bg-orange-500/20 text-orange-200",
};

export function SaleStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${COLORS[key] ?? "bg-white/10"}`}>
      {LABELS[key] ?? status}
    </span>
  );
}
