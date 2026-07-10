"use client";

import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "contato@judgetcg.com.br";

export default function SuportePage() {
  return (
    <MobileLayout>
      <main className="container mx-auto max-w-lg px-4 py-10 text-foreground">
        <Link href="/loja" className="text-sm text-muted-foreground hover:text-white">
          ← Voltar
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Suporte</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Estamos aqui para ajudar com cadastro de loja, verificação KYC (Stripe), pagamentos e painel do
          vendedor.
        </p>

        <section className="mt-8 space-y-4 surface-card p-5">
          <h2 className="font-semibold text-primary">Contato</h2>
          <p className="text-sm text-muted-foreground">
            Envie um e-mail com o assunto do problema e, se possível, o e-mail da sua conta Google.
          </p>
          <Button asChild className="w-full bg-primary text-primary-foreground">
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Suporte%20Judge%20TCG`}>{SUPPORT_EMAIL}</a>
          </Button>
        </section>

        <section className="mt-6 space-y-3 text-sm text-muted-foreground">
          <h2 className="font-semibold text-white">KYC / cadastro de loja</h2>
          <p>
            Após concluir o formulário no Stripe, o status pode levar alguns minutos para atualizar. Se você
            voltou do Stripe e ainda vê &quot;loja suspensa&quot;, aguarde na página ou atualize — o sistema
            sincroniza automaticamente.
          </p>
          <p>
            Se a verificação estiver &quot;em análise&quot;, a Stripe costuma concluir em até 2 dias úteis.
          </p>
          <Button asChild variant="outline" className="mt-2 border-border">
            <Link href="/loja/suspensa">Status da minha loja</Link>
          </Button>
        </section>
      </main>
    </MobileLayout>
  );
}
