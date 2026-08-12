import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Venda no JudgeTCG — Credenciamento de hobby store",
  description:
    "Conecte sua hobby store (CNPJ) a um marketplace especializado em TCGs. Sem plano free. Aprovação antes de publicar ofertas.",
};

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Quem pode vender",
    body: "Hobby stores com CNPJ ativo — loja física, online ou ambas. Pessoa física com CPF compra no JudgeTCG; não publica ofertas como loja.",
  },
  {
    title: "Como funciona a aprovação",
    body: "Você solicita credenciamento, confirma os dados do CNPJ, informa o responsável e o perfil comercial. A equipe JudgeTCG analisa antes de liberar a vitrine.",
  },
  {
    title: "Documentos necessários",
    body: "CNPJ válido, dados do responsável (CPF e e-mail profissional) e ao menos uma evidência comercial (site, Instagram, Google Business, fotos da loja ou marketplace existente).",
  },
  {
    title: "TCGs suportados",
    body: "Catálogo unificado com beachhead Lorcana e expansão via allowlist da plataforma (Magic, Pokémon, One Piece, Digimon, Yu-Gi-Oh! e outros conforme ADR).",
  },
  {
    title: "Estoque",
    body: "Privilegiamos estoque real. Após aprovação, importe CSV ou sync — match com o Master Catalog. Não cadastre produto manualmente no onboarding.",
  },
  {
    title: "Pagamentos",
    body: "Receba via PIX da loja e/ou Stripe Connect após KYC. Publicar ofertas exige loja credenciada e meios de pagamento configurados.",
  },
  {
    title: "Taxas e planos",
    body: "Não há plano gratuito para vendedores. Entrada mínima = Lojista (pago) após aprovação. Assinatura — sem comissão sobre vendas nos planos atuais.",
  },
  {
    title: "Envio e atendimento",
    body: "Você opera fulfillment e suporte ao comprador. Políticas de condição, cancelamento e prazo fazem parte do acordo de credenciamento.",
  },
  {
    title: "Prazo de aprovação",
    body: "Após enviar a solicitação você recebe um protocolo #JTCG-… e acompanha o status Em análise. Não há “cadastro instantâneo” de seller.",
  },
];

export default function VenderLandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className="relative overflow-hidden border-b border-border"
        style={{
          background:
            "radial-gradient(120% 80% at 10% 0%, color-mix(in oklch, var(--primary) 12%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in oklch, var(--muted) 65%, transparent), var(--background))",
        }}
      >
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            JudgeTCG · Hobby stores
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Venda seus produtos no JudgeTCG
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Conecte sua hobby store a um marketplace especializado em TCGs. Credenciamento com CNPJ —
            sem formulário de “criar conta seller” e sem plano free.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/entrar?intent=sell&next=/vender/credenciamento"
              className="inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Solicitar credenciamento
            </Link>
            <Link
              href="/entrar?intent=buy&next=/loja"
              className="inline-flex rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              Quero comprar
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Já tem loja aprovada?{" "}
            <Link href="/entrar?next=/vendedor/painel" className="text-primary underline-offset-2 hover:underline">
              Entrar no painel
            </Link>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-10 px-4 py-14 sm:px-6">
        {SECTIONS.map((section) => (
          <section key={section.title} className="border-b border-border pb-10 last:border-0">
            <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {section.body}
            </p>
          </section>
        ))}

        <section className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Próximo passo</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Preencha o pedido multi-etapas: identificação, CNPJ, responsável, perfil, evidência e
            operação. Após o envio você recebe um protocolo #JTCG-… e acompanha a análise.
          </p>
          <Link
            href="/vender/credenciamento"
            className="mt-5 inline-flex rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Solicitar credenciamento
          </Link>
        </section>
      </div>
    </main>
  );
}
