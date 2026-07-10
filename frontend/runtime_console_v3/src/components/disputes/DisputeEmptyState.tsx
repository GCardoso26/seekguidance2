"use client";

import Link from "next/link";

export function DisputeEmptyState() {
  return (
    <div className="surface-card p-8 text-center">
      <p className="text-4xl">🎉</p>
      <h2 className="mt-4 text-xl font-semibold">Nenhuma disputa ativa</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        O sistema de juízes certificados garante resolução em até 48h quando necessário.
      </p>
      <Link
        href="/docs/disputas"
        className="mt-6 inline-block text-sm text-primary underline"
      >
        Como evitar disputas
      </Link>
    </div>
  );
}
