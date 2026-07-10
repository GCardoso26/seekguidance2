import { Badge } from "@/components/ui/badge";

const LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  processing: "Preparando",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
  disputed: "Disputa",
};

const VARIANTS: Record<string, "warning" | "success" | "secondary" | "danger" | "outline"> = {
  pending: "warning",
  paid: "success",
  processing: "secondary",
  shipped: "secondary",
  delivered: "outline",
  cancelled: "danger",
  disputed: "warning",
};

export function SaleStatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <Badge variant={VARIANTS[key] ?? "outline"} className="font-medium">
      {LABELS[key] ?? status}
    </Badge>
  );
}
