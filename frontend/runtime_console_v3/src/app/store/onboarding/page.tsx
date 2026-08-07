"use client";



import { useEffect, useState } from "react";

import Link from "next/link";

import { MobileLayout } from "@/components/layout/MobileLayout";



export default function StoreOnboardingPage() {

  const [error, setError] = useState<string | null>(null);



  useEffect(() => {

    async function start() {

      try {

        const mineRes = await fetch("/api/stores/mine");

        const stores = mineRes.ok ? ((await mineRes.json()) as Array<{ id?: string }>) : [];

        const storeId = stores[0]?.id;



        const res = await fetch("/api/marketplace/shop/connect/onboard", {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(storeId ? { store_id: storeId } : {}),

        });

        const data = (await res.json().catch(() => ({}))) as { onboarding_url?: string; detail?: string };

        if (!res.ok) {

          throw new Error(String(data.detail ?? "Falha ao iniciar onboarding Stripe"));

        }

        if (data.onboarding_url) {

          window.location.href = data.onboarding_url;

          return;

        }

        throw new Error("URL de onboarding não retornada");

      } catch (err) {

        setError(err instanceof Error ? err.message : "Erro ao conectar Stripe");

      }

    }

    void start();

  }, []);



  return (

    <MobileLayout>

      <div className="container mx-auto px-4 py-16 text-center">

        <h1 className="text-xl font-bold">{error ? "Não foi possível conectar" : "Redirecionando para Stripe…"}</h1>

        <p className="mt-2 text-sm text-muted-foreground">

          {error ?? "Configure sua conta para receber pagamentos."}

        </p>

        {error && (

          <Link href="/vendedor/painel/configuracoes/pagamentos" className="mt-6 inline-block text-primary underline">

            Voltar ao dashboard

          </Link>

        )}

      </div>

    </MobileLayout>

  );

}


