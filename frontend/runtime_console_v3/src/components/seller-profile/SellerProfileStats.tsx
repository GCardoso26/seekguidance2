import type { MarketplaceSellerProfile } from "@/lib/seller-profile-query";

type Props = {
  seller: MarketplaceSellerProfile;
};

export function SellerProfileStats({ seller }: Props) {
  const stats = [
    { label: "Itens à venda", value: seller.total_items.toLocaleString("pt-BR") },
    { label: "Itens únicos", value: seller.unique_items.toLocaleString("pt-BR") },
    { label: "Avaliações", value: seller.total_reviews.toLocaleString("pt-BR") },
    {
      label: "Membro desde",
      value: seller.joined_at
        ? new Date(seller.joined_at).toLocaleDateString("pt-BR", { year: "numeric", month: "short" })
        : "—",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="surface-card px-4 py-3 text-center"
        >
          <p className="text-lg font-bold text-foreground">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
