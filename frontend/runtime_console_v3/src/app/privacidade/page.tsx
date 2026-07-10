import Link from "next/link";

export const metadata = {
  title: "Privacidade — Judge TCG",
  description: "Política de privacidade do Judge TCG",
};

export default function PrivacidadePage() {
  return (
    <article className="luxury-page-narrow pb-24 pt-8">
      <p className="mb-4 text-xs tracking-[0.3em] text-primary uppercase">Legal</p>
      <h1 className="mb-8 text-foreground">Política de Privacidade</h1>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        O Judge TCG (judgetcg.com.br) é um assistente de regras para jogos de cartas colecionáveis.
      </p>
      <h2 className="mb-3 text-xl text-foreground">Dados recolhidos</h2>
      <ul className="mb-6 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
        <li>Sem login: histórico local no seu browser (localStorage), até 10 consultas.</li>
        <li>Com login Google (Supabase Auth): identificador, nome e email fornecidos pelo OAuth.</li>
        <li>Consultas, vereditos e fontes podem ser guardados na nuvem para histórico e favoritos.</li>
        <li>Métricas agregadas de utilização (sem conteúdo das perguntas em relatórios internos).</li>
      </ul>
      <h2 className="mb-3 text-xl text-foreground">Armazenamento</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Dados de conta e histórico cloud são processados pelo Supabase (PostgreSQL). O fornecedor
        atua como subprocessador; recomenda-se assinar o DPA em supabase.com/dpa antes do go-live
        com autenticação.
      </p>
      <h2 className="mb-3 text-xl text-foreground">Retenção</h2>
      <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
        Mantemos os dados até solicitar exclusão ou eliminar a conta. Métricas brutas de analytics
        são arquivadas após 90 dias.
      </p>
      <h2 className="mb-3 text-xl text-foreground">Exclusão de dados</h2>
      <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
        Utilizadores autenticados podem pedir exclusão via menu de conta (chama{" "}
        <code className="rounded border border-border bg-card shadow-card px-1.5 py-0.5 text-foreground">
          DELETE /runtime/judge/account
        </code>
        ) ou contacto com o operador do serviço.
      </p>
      <Link href="/judge" className="luxury-link text-sm font-medium">
        Voltar ao Judge
      </Link>
    </article>
  );
}
