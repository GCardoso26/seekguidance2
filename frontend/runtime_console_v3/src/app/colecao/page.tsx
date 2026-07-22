"use client";

import { CollectionDashboard } from "@/components/collection-v2/CollectionDashboard";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function ColecaoHomePage() {
  if (!isFeatureEnabled("COLLECTION_V2")) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <p className="text-small text-muted-foreground">Collection V2 desligada neste ambiente.</p>
        <Link href="/colecao/cartas" className="mt-3 inline-block text-primary hover:underline">
          Ir para lista de cartas
        </Link>
      </div>
    );
  }

  return <CollectionDashboard />;
}
