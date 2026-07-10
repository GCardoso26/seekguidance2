"use client";

type Props = {
  status: string;
  onChange: (status: string) => void;
};

const STATUSES = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "processing", label: "Processando" },
  { value: "shipped", label: "Enviado" },
  { value: "delivered", label: "Entregue" },
  { value: "cancelled", label: "Cancelado" },
];

export function OrderFilters({ status, onChange }: Props) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      className="surface-card rounded-lg px-3 py-2 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s.value || "all"} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
