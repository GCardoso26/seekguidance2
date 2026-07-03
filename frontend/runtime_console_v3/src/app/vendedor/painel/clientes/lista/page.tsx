"use client";

import { CustomersPage } from "@/components/seller-customers";
import { Suspense } from "react";

export default function ClientesListaPage() {
  return (
    <Suspense fallback={<p className="p-6 text-luxury-mist">Carregando…</p>}>
      <CustomersPage />
    </Suspense>
  );
}
