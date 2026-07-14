"use client";

import { useSearchParams } from "next/navigation";
import { InlineAlert } from "@/components/ui/async-state";

/** Isla de client só para query `from=marketplace` — mantém /loja como RSC. */
export function LojaMarketplaceAlert() {
  const searchParams = useSearchParams();
  if (searchParams.get("from") !== "marketplace") return null;

  return (
    <InlineAlert
      className="mb-4"
      tone="info"
      message="O hub de compras de singles TCG é a Loja. Produtos selados e decklists continuam em Produtos selados."
    />
  );
}
