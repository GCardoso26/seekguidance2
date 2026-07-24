import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ImageIcon,
  Layers,
  LayoutDashboard,
  LineChart,
  Mail,
  MessageSquare,
  Shield,
  Terminal,
  TrendingUp,
} from "lucide-react";

export type AdminSidebarItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
};

export const ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, href: "/admin" },
  { id: "dashboard", label: "Dashboard marketplace", icon: BarChart3, href: "/admin/dashboard" },
  { id: "retention", label: "Retenção", icon: TrendingUp, href: "/admin/retention" },
  { id: "analytics", label: "Analytics", icon: LineChart, href: "/admin/analytics" },
  { id: "catalog", label: "Catálogo TCGs", icon: Layers, href: "/admin/catalog" },
  { id: "image-health", label: "Saúde de imagens", icon: ImageIcon, href: "/admin/catalog/image-health" },
  { id: "moderation", label: "Moderação", icon: Shield, href: "/admin/moderation" },
  { id: "feedback", label: "Feedback", icon: MessageSquare, href: "/admin/feedback" },
  { id: "newsletter", label: "Newsletter", icon: Mail, href: "/admin/newsletter" },
  { id: "console", label: "Console", icon: Terminal, href: "/admin/console" },
  // ADR-016: "Ingestão SWU" removed — SWU hard-exit from product ecosystem.
];

export function adminSidebarItemActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
