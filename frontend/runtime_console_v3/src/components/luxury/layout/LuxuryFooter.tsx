import { Scale } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/luxury/ui/Separator";

const COLUMNS = [
  {
    title: "Produto",
    links: [
      { label: "Para Jogadores", href: "/jogador", external: false },
      { label: "Para Juízes", href: "/juiz", external: false },
      { label: "Para Lojas", href: "/loja", external: false },
      { label: "Mesa de Regras", href: "/judge", external: false },
      { label: "Funcionalidades", href: "/features", external: false },
      { label: "Planos", href: "/pricing", external: false },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Documentação", href: "/", external: false },
      { label: "Torneios", href: "/tournament/create", external: false },
      { label: "Comunidade", href: "/social/communities", external: false },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "/about", external: false },
      { label: "Contacto", href: "mailto:contato@judgetcg.com.br", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacidade", href: "/privacidade", external: false },
      { label: "Termos", href: "#", external: false },
    ],
  },
];

export function LuxuryFooter() {
  return (
    <footer className="border-t border-white/5 bg-card">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                <Scale className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </span>
              <span className="text-sm font-medium tracking-[0.15em] text-foreground uppercase">
                Judge TCG
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Rulings com fonte. Torneios no horário. A mesa que juízes, jogadores e lojas usam no
              competitivo sério.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-medium tracking-[0.2em] text-foreground uppercase">
                {col.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                        {...(link.href.startsWith("http") || link.href.startsWith("mailto")
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Judge TCG / tcghub.ai. Todos os direitos reservados.</p>
          <p className="tracking-wide">Feito para o competitivo sério.</p>
        </div>
      </div>
    </footer>
  );
}
