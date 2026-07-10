"use client";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (value: string) => void;
};

export function OrdersFilterBar({
  search,
  onSearchChange,
  paymentMethod,
  onPaymentMethodChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Pesquisar por: Pedido, Cliente, CPF, Email, SKU, Rastreio…"
        className="min-w-[240px] flex-1 surface-card rounded-lg px-3 py-2 text-sm"
      />
      <select
        value={paymentMethod}
        onChange={(e) => onPaymentMethodChange(e.target.value)}
        className="surface-card rounded-lg px-3 py-2 text-sm"
        aria-label="Forma de pagamento"
      >
        <option value="">Pagamento: todos</option>
        <option value="pix">PIX</option>
        <option value="stripe">Stripe</option>
        <option value="credit_card">Cartão</option>
      </select>
    </div>
  );
}
