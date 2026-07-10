"use client";

import { CustomersPage } from "@/components/seller-customers";
import { Suspense } from "react";

export default function ClientesListaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Carregando…</p>}>
      <CustomersPage />
    </Suspense>
  );
}
