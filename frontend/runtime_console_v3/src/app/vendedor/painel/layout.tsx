import Link from "next/link";

const NAV = [
  { href: "/vendedor/painel", label: "Dashboard" },
  { href: "/vendedor/painel/listagens", label: "Listagens" },
  { href: "/store/dashboard", label: "Vendas" },
  { href: "/store/dashboard?tab=avaliacoes", label: "Avaliações" },
  { href: "/store/dashboard?tab=pagamentos", label: "Configurações" },
];

export default function VendedorPainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-white/10 bg-luxury-onyx/80 px-4 py-3">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold text-luxury-mist">Painel do Vendedor</span>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/15"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </>
  );
}
