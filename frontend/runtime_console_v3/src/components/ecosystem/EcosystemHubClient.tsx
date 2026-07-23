"use client";

import Link from "next/link";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ECOSYSTEM_SURFACES } from "@/lib/ecosystem/surfaces";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export function EcosystemHubClient() {
  if (!isFeatureEnabled("ECOSYSTEM_PLATFORM")) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Ecossistema desabilitado.
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Ecossistema" }]} />
        <header>
          <h1 className="text-3xl font-semibold">Ecossistema</h1>
          <p className="mt-2 text-muted-foreground">
            Arquitetura de extensibilidade — APIs, SDK, widgets e ferramentas. Sem parceiros
            acoplados.
          </p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ECOSYSTEM_SURFACES.map((s) => (
            <li key={s.id} className="rounded-xl border border-border p-4">
              <h2 className="font-semibold">{s.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>
              <Link href={s.entrypoint.startsWith("/") ? s.entrypoint : "/"} className="mt-2 inline-flex text-sm text-primary hover:underline">
                Abrir →
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MobileLayout>
  );
}
