import type { Metadata } from "next";
import VendedorPainelClientLayout from "@/app/vendedor/painel/VendedorPainelClientLayout";
import { SellerProviders } from "@/providers/SellerProviders";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/vendedor/painel", {
  title: "Painel do vendedor",
  description:
    "Gerencie estoque, listagens, pedidos e estatísticas da sua loja no Judge TCG.",
});

export default function VendedorPainelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SellerProviders>
      <VendedorPainelClientLayout>{children}</VendedorPainelClientLayout>
    </SellerProviders>
  );
}
