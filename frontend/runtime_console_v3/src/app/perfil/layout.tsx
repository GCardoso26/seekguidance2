import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Meu Perfil",
  description: "Gerencie seu perfil, coleção, pedidos e preferências no Judge TCG.",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/perfil", label: "Perfil" },
  { href: "/perfil/colecao", label: "Coleção" },
  { href: "/perfil/pedidos", label: "Pedidos" },
  { href: "/perfil/seguidos", label: "Seguidos" },
  { href: "/perfil/alertas", label: "Alertas" },
];

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav
        aria-label="Navegação do perfil"
        className="border-b border-white/10 bg-luxury-onyx/80"
      >
        <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-luxury-mist transition-colors hover:bg-white/5 hover:text-luxury-frost"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}
