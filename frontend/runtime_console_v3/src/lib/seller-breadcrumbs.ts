import type { BreadcrumbItem } from "@/components/ui/breadcrumbs";

const SECTION_LABELS: Record<string, string> = {
  painel: "Dashboard",
  catalogo: "Catálogo",
  cartas: "Cartas",
  produtos: "Produtos",
  expansoes: "Expansões",
  jogos: "Jogos",
  estoque: "Estoque",
  pedidos: "Pedidos",
  clientes: "Clientes",
  lista: "Lista",
  atendimento: "Atendimento",
  tickets: "Tickets",
  financeiro: "Financeiro",
  receitas: "Receitas",
  repasses: "Repasses",
  stripe: "Stripe",
  pix: "PIX",
  reconciliacao: "Reconciliação",
  chargebacks: "Chargebacks",
  auditoria: "Auditoria",
  cupons: "Cupons",
  buylist: "Buylist",
  reputacao: "Reputação",
  estatisticas: "Estatísticas",
  inteligencia: "Inteligência",
  equipe: "Equipe",
  usuarios: "Usuários",
  permissoes: "Permissões",
  configuracoes: "Configurações",
  notificacoes: "Notificações",
  api: "API",
  frete: "Frete",
  pagamentos: "Pagamentos",
  torneios: "Torneios",
  pdv: "PDV",
  planos: "Planos",
  onboarding: "Onboarding",
  pro: "Pro",
};

/** Gera breadcrumbs a partir do pathname do painel vendedor. */
export function sellerPanelBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Início", href: "/" },
    { label: "Painel", href: "/vendedor/painel" },
  ];

  if (!pathname.startsWith("/vendedor/painel")) return items;

  const rest = pathname.replace(/^\/vendedor\/painel\/?/, "");
  if (!rest) return items;

  const segments = rest.split("/").filter(Boolean);
  let acc = "/vendedor/painel";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (/^\[/.test(seg) || /^[0-9a-f-]{36}$/i.test(seg)) continue;

    acc += `/${seg}`;
    const label = SECTION_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = i === segments.length - 1;

    items.push({
      label,
      href: isLast ? undefined : acc,
    });
  }

  return items;
}
