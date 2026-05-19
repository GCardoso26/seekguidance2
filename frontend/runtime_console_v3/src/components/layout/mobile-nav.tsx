"use client";
import Link from "next/link";

export function MobileNav() {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border p-3 bg-card">
      <span className="font-semibold text-sm">Runtime Console</span>
      <Link href="/dashboard" className="text-xs text-primary">Menu</Link>
    </header>
  );
}
