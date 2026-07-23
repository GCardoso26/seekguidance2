"use client";

import Link from "next/link";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  EDITORIAL_SEED,
  EDITORIAL_TYPE_LABELS,
  editorialDeepLinks,
} from "@/lib/editorial/catalog";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

export function EditorialHubClient() {
  if (!isFeatureEnabled("EDITORIAL_PLATFORM")) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Editorial Platform desabilitado.
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Editorial" }]} />
        <header>
          <h1 className="text-3xl font-semibold">Editorial</h1>
          <p className="mt-2 text-muted-foreground">
            Notícias, guias, deck tech e meta — com navegação contextual para carta, deck,
            expansão, portal, marketplace e torneios.
          </p>
        </header>
        <ul className="space-y-4">
          {EDITORIAL_SEED.map((doc) => {
            const links = editorialDeepLinks(doc);
            return (
              <li key={doc.id} className="rounded-xl border border-border bg-card/40 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {EDITORIAL_TYPE_LABELS[doc.type]}
                </p>
                <h2 className="mt-1 text-lg font-semibold">{doc.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{doc.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {links.map((l) => (
                    <Link
                      key={`${doc.id}-${l.href}`}
                      href={l.href}
                      className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/40"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-center text-xs text-muted-foreground">
          Estrutura editorial — conteúdo pleno via Assets/newsletter sem CMS BC novo.
        </p>
      </div>
    </MobileLayout>
  );
}
