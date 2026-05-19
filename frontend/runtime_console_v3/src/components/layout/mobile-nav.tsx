"use client";
import Link from "next/link";

export function MobileNav() {
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border p-3 bg-card">
      <span className="font-semibold text-sm">Runtime Console</span>
      <div className="flex gap-3 text-xs">
        <Link href="/judge" className="text-primary">Judge</Link>
        <Link href="/dashboard" className="text-muted-foreground">Console</Link>
      </div>
    </header>
  );
}
