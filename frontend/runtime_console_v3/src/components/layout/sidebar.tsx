"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/tenants", label: "Tenants" },
  { href: "/replay", label: "Replay" },
  { href: "/observability", label: "Observability" },
  { href: "/federation", label: "Federation" },
  { href: "/incidents", label: "Incidents" },
  { href: "/deployments", label: "Deployments" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card/50 p-3 gap-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">Runtime Console</p>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className={cn("rounded-md px-3 py-2 text-sm hover:bg-muted", pathname === item.href && "bg-muted text-primary")}>
          {item.label}
        </Link>
      ))}
    </aside>
  );
}
