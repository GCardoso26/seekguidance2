"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";

/** ADR-018: criação de loja só via credenciamento CNPJ — não formulário genérico. */
export default function CreateStorePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vender");
  }, [router]);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Credenciamento de loja</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Hobby stores entram no JudgeTCG com CNPJ, após aprovação — não há cadastro rápido nem plano
          gratuito para vendedores.
        </p>
        <Link
          href="/vender"
          className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Ir para Vender no JudgeTCG
        </Link>
      </div>
    </MobileLayout>
  );
}
