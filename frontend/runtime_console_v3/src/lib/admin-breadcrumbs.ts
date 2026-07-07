import type { BreadcrumbItem } from "@/components/ui/breadcrumbs";

const SECTION_LABELS: Record<string, string> = {
  dashboard: "Dashboard marketplace",
  retention: "Retenção",
  analytics: "Analytics",
  catalog: "Catálogo TCGs",
  moderation: "Moderação",
  feedback: "Feedback",
  newsletter: "Newsletter",
  console: "Console",
  ingestion: "Ingestão SWU",
};

/** Gera breadcrumbs a partir do pathname do painel admin. */
export function adminPanelBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: "Início", href: "/" },
    { label: "Admin", href: "/admin" },
  ];

  if (!pathname.startsWith("/admin")) return items;

  const rest = pathname.replace(/^\/admin\/?/, "");
  if (!rest) return items;

  const segments = rest.split("/").filter(Boolean);
  let acc = "/admin";

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
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
