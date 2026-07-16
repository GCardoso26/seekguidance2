import { Suspense } from "react";
import { SearchPageClient } from "@/src/components/buyer/SearchPageClient";
import { Loading } from "@/src/components/ui";

export default function SearchPage() {
  return (
    <Suspense fallback={<Loading label="Carregando busca…" />}>
      <SearchPageClient />
    </Suspense>
  );
}
