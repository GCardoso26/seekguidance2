import type { LucideIcon } from "lucide-react";
import {
  Box,
  CreditCard,
  DollarSign,
  Gamepad2,
  Headphones,
  Layers,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import { planHasFeature } from "@/lib/seller-plans";

export type SidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  feature?: string | null;
  badgeKey?: "pending_payment" | "open_tickets";
  /** Oculto do menu até a rota existir. */
  comingSoon?: boolean;
  children?: SidebarItem[];
};

/** Remove itens marcados como comingSoon (recursivo). */
export function filterAvailableSidebarItems(items: SidebarItem[]): SidebarItem[] {
  return items
    .filter((item) => !item.comingSoon)
    .map((item) =>
      item.children?.length
        ? { ...item, children: filterAvailableSidebarItems(item.children) }
        : item,
    );
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/vendedor/painel" },
  {
    id: "catalog",
    label: "Catálogo",
    icon: Package,
    href: "/vendedor/painel/catalogo/cartas",
    children: [
      { id: "cards", label: "Cartas", icon: CreditCard, href: "/vendedor/painel/catalogo/cartas" },
      { id: "products", label: "Produtos", icon: Box, href: "/vendedor/painel/catalogo/produtos" },
      { id: "expansions", label: "Expansões", icon: Layers, href: "/vendedor/painel/catalogo/expansoes" },
      { id: "games", label: "Jogos", icon: Gamepad2, href: "/vendedor/painel/catalogo/jogos" },
    ],
  },
  {
    id: "inventory",
    label: "Estoque",
    icon: Warehouse,
    href: "/vendedor/painel/estoque",
    children: [
      { id: "stock", label: "Estoque", icon: Warehouse, href: "/vendedor/painel/estoque" },
      {
        id: "movements",
        label: "Movimentações",
        icon: TrendingUp,
        href: "/vendedor/painel/estoque/movimentacoes",
        comingSoon: true,
      },
      {
        id: "import",
        label: "Importação CSV",
        icon: Package,
        href: "/vendedor/painel/estoque/importacao",
        comingSoon: true,
      },
    ],
  },
  {
    id: "orders",
    label: "Pedidos",
    icon: ShoppingCart,
    href: "/vendedor/painel/pedidos",
    badgeKey: "pending_payment",
    children: [
      { id: "orders-all", label: "Todos", icon: ShoppingCart, href: "/vendedor/painel/pedidos?tab=all" },
      {
        id: "orders-pending",
        label: "Aguardando pagamento",
        icon: ShoppingCart,
        href: "/vendedor/painel/pedidos?tab=pending_payment",
      },
      { id: "orders-paid", label: "Pagos", icon: ShoppingCart, href: "/vendedor/painel/pedidos?tab=paid" },
      { id: "orders-separate", label: "Separação", icon: Package, href: "/vendedor/painel/pedidos?tab=to_separate" },
      { id: "orders-shipped", label: "Enviados", icon: Truck, href: "/vendedor/painel/pedidos?tab=shipped" },
      { id: "orders-delivered", label: "Entregues", icon: Truck, href: "/vendedor/painel/pedidos?tab=delivered" },
      { id: "orders-cancelled", label: "Cancelados", icon: ShoppingCart, href: "/vendedor/painel/pedidos?tab=cancelled" },
      { id: "orders-refunded", label: "Reembolsos", icon: DollarSign, href: "/vendedor/painel/pedidos?tab=refunded" },
    ],
  },
  {
    id: "customers",
    label: "Clientes",
    icon: Users,
    href: "/vendedor/painel/clientes/lista",
    feature: "crm",
    children: [
      { id: "customers-list", label: "Lista", icon: Users, href: "/vendedor/painel/clientes/lista" },
      {
        id: "customers-crm",
        label: "CRM",
        icon: Users,
        href: "/vendedor/painel/clientes/crm",
        comingSoon: true,
      },
      {
        id: "customers-history",
        label: "Histórico",
        icon: TrendingUp,
        href: "/vendedor/painel/clientes/historico",
        comingSoon: true,
      },
    ],
  },
  {
    id: "support",
    label: "Atendimento",
    icon: Headphones,
    href: "/vendedor/painel/atendimento/tickets",
    badgeKey: "open_tickets",
    children: [
      { id: "tickets", label: "Tickets", icon: Headphones, href: "/vendedor/painel/atendimento/tickets" },
      {
        id: "chat",
        label: "Chat",
        icon: Headphones,
        href: "/vendedor/painel/atendimento/chat",
        comingSoon: true,
      },
      {
        id: "complaints",
        label: "Reclamações",
        icon: Headphones,
        href: "/vendedor/painel/atendimento/reclamacoes",
        comingSoon: true,
      },
    ],
  },
  {
    id: "finance",
    label: "Financeiro",
    icon: DollarSign,
    href: "/vendedor/painel/financeiro/receitas",
    children: [
      { id: "revenue", label: "Receitas", icon: DollarSign, href: "/vendedor/painel/financeiro/receitas" },
      { id: "payouts", label: "Repasses", icon: DollarSign, href: "/vendedor/painel/financeiro/repasses" },
      { id: "stripe", label: "Stripe", icon: DollarSign, href: "/vendedor/painel/financeiro/stripe" },
      { id: "pix", label: "PIX", icon: DollarSign, href: "/vendedor/painel/financeiro/pix" },
      { id: "reconciliation", label: "Reconciliação", icon: DollarSign, href: "/vendedor/painel/financeiro/reconciliacao" },
      { id: "chargebacks", label: "Chargebacks", icon: DollarSign, href: "/vendedor/painel/financeiro/chargebacks" },
      { id: "audit", label: "Auditoria", icon: DollarSign, href: "/vendedor/painel/financeiro/auditoria" },
    ],
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    href: "/vendedor/painel/cupons",
    children: [
      { id: "coupons", label: "Cupons", icon: Megaphone, href: "/vendedor/painel/cupons" },
      {
        id: "buylist",
        label: "Buylist",
        icon: Megaphone,
        href: "/vendedor/painel/buylist",
        feature: "buylist",
      },
      {
        id: "promos",
        label: "Promoções",
        icon: Megaphone,
        href: "/vendedor/painel/marketing/promocoes",
        comingSoon: true,
      },
    ],
  },
  {
    id: "reputation",
    label: "Reputação",
    icon: TrendingUp,
    href: "/vendedor/painel/reputacao",
  },
  {
    id: "analytics",
    label: "Estatísticas",
    icon: TrendingUp,
    href: "/vendedor/painel/estatisticas",
    feature: "analytics",
    children: [
      { id: "stats-overview", label: "Visão geral", icon: TrendingUp, href: "/vendedor/painel/estatisticas" },
      {
        id: "stats-intelligence",
        label: "Inteligência",
        icon: TrendingUp,
        href: "/vendedor/painel/estatisticas/inteligencia",
        feature: "analytics",
      },
    ],
  },
  {
    id: "team",
    label: "Equipe",
    icon: Users,
    href: "/vendedor/painel/equipe/usuarios",
    children: [
      { id: "team-users", label: "Usuários", icon: Users, href: "/vendedor/painel/equipe/usuarios" },
      { id: "team-perms", label: "Permissões", icon: Settings, href: "/vendedor/painel/equipe/permissoes" },
      {
        id: "team-logs",
        label: "Logs",
        icon: TrendingUp,
        href: "/vendedor/painel/equipe/logs",
        comingSoon: true,
      },
    ],
  },
  { id: "settings", label: "Configurações", icon: Settings, href: "/vendedor/painel/configuracoes" },
  { id: "pdv", label: "PDV", icon: ShoppingCart, href: "/vendedor/painel/pdv", feature: "pdv" },
];

export function isSidebarItemLocked(plan: string, item: SidebarItem): boolean {
  return Boolean(item.feature && !planHasFeature(plan, item.feature));
}

export function sidebarItemActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0];
  if (base === "/vendedor/painel") return pathname === base;
  return pathname === base || pathname.startsWith(`${base}/`);
}
