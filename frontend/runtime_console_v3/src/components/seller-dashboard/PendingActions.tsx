import Link from "next/link";

type Props = {
  shipments?: number;
  disputes?: number;
  lowStock?: number;
  kycIncomplete?: boolean;
};

export function PendingActions({
  shipments = 0,
  disputes = 0,
  lowStock = 0,
  kycIncomplete = false,
}: Props) {
  const items = [
    kycIncomplete
      ? { count: 1, label: "completar cadastro KYC", href: "#kyc-status" }
      : null,
    { count: shipments, label: "pedidos aguardando envio", href: "/vendedor/painel/pedidos?tab=to_separate" },
    { count: disputes, label: "disputas abertas", href: "/vendedor/painel/pedidos?tab=cancelled" },
    { count: lowStock, label: "itens com estoque baixo", href: "/vendedor/painel/estoque" },
  ].filter((i): i is { count: number; label: string; href: string } => Boolean(i && i.count > 0));

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma ação pendente.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item.label}>
          <Link href={item.href} className="text-primary hover:underline">
            • {item.count} {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
