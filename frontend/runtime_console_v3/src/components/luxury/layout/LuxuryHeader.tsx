"use client";

import { useEffect, useState } from "react";
import { Menu, Scale, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/luxury/ui/Button";
import { useScrollProgress } from "@/hooks/useScrollProgress";

const NAV = [
  { label: "Loja", href: "/loja" },
  { label: "Planos", href: "/pricing" },
];

export function LuxuryHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progress = useScrollProgress();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled ? "border-b border-white/5 bg-background/80 backdrop-blur-xl" : "bg-transparent",
      )}
    >
      <div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-luxury-gold via-luxury-silver to-luxury-gold"
        style={{ transform: `scaleX(${progress})` }}
        aria-hidden
      />

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="Judge TCG — início">
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Scale className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </span>
          <span className="text-sm font-medium tracking-[0.2em] text-foreground uppercase">
            Judge <span className="text-primary">TCG</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/entrar">
            <Button variant="primary">Entrar</Button>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="luxury-mobile-nav"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
        </button>
      </div>

      {open && (
        <nav
          id="luxury-mobile-nav"
          className="border-t border-white/5 bg-card/95 px-6 py-6 backdrop-blur-xl md:hidden"
          aria-label="Mobile"
        >
          <div className="flex flex-col gap-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-base text-foreground"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/entrar">
              <Button className="w-full">Entrar</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
