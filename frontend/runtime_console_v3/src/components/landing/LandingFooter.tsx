import Link from "next/link";
import { JudgeLogo } from "@/components/judge/JudgeLogo";

const FOOTER_COLUMNS = [
  {
    title: "Produto",
    links: [
      { href: "/judge", label: "Mesa de Regras" },
      { href: "/pricing", label: "Preços" },
      { href: "/observability", label: "Qualidade" },
    ],
  },
  {
    title: "Comunidade",
    links: [
      { href: "/search", label: "Torneios" },
      { href: "/social", label: "Social" },
      { href: "/marketplace", label: "Lojas" },
      { href: "/leagues", label: "Ligas" },
    ],
  },
  {
    title: "Suporte",
    links: [
      { href: "/perfil", label: "Perfil" },
      { href: "/#como-funciona", label: "Como funciona" },
      { href: "https://discord.gg/judgetcg", label: "Discord" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidade", label: "Privacidade" },
      { href: "/privacidade", label: "Termos" },
    ],
  },
] as const;

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900/50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <JudgeLogo size={32} />
            <span className="font-bold text-foreground">Judge TCG</span>
          </Link>
          <div className="flex gap-4 text-sm text-slate-400">
            <a href="https://discord.gg/judgetcg" className="hover:text-foreground" rel="noopener noreferrer">
              Discord
            </a>
            <a href="https://x.com/judgetcg" className="hover:text-foreground" rel="noopener noreferrer">
              X / Twitter
            </a>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <Link href={link.href} className="text-sm text-slate-400 hover:text-slate-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © 2026 Judge TCG. Não afiliado às empresas dos jogos.
        </p>
      </div>
    </footer>
  );
}
