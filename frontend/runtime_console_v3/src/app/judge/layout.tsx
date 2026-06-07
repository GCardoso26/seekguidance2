"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUserRole } from "@/hooks/useUserRole";

const NAV = [
  { href: "/judge/dashboard", label: "Dashboard" },
  { href: "/judge/rulings", label: "Rulings" },
  { href: "/judge/metrics", label: "Métricas" },
];

export default function JudgePortalLayout({ children }: { children: ReactNode }) {
  const { isJudge, isAdmin, loading } = useUserRole();
  const router = useRouter();
  const allowed = isJudge || isAdmin;

  useEffect(() => {
    if (!loading && !allowed) router.replace("/");
  }, [loading, allowed, router]);

  if (loading || !allowed) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-emerald-400/80">Judge Assistant</p>
            <h1 className="text-lg font-semibold">Painel do Juiz</h1>
          </div>
          <nav className="flex gap-4 text-sm">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-white/70 hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
