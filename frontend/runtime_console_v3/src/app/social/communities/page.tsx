import { Suspense } from "react";
import CommunitiesPageClient from "./CommunitiesPageClient";

export default function CommunitiesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-luxury-mist">Carregando…</div>}>
      <CommunitiesPageClient />
    </Suspense>
  );
}
