import Link from "next/link";

export const metadata = {
  title: "Privacidade — Judge TCG",
  description: "Política de privacidade do Judge TCG",
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-[hsl(222_20%_30%)]">
      <h1 className="mb-6 text-2xl font-semibold text-[hsl(var(--foreground))]">
        Política de Privacidade
      </h1>
      <p className="mb-4">
        O Judge TCG (judgetcg.com.br) é um assistente de regras para jogos de cartas colecionáveis.
      </p>
      <h2 className="mb-2 text-lg font-semibold">Dados recolhidos</h2>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li>Sem login: histórico local no seu browser (localStorage), até 10 consultas.</li>
        <li>Com login Google (Supabase Auth): identificador, nome e email fornecidos pelo OAuth.</li>
        <li>Consultas, vereditos e fontes podem ser guardados na nuvem para histórico e favoritos.</li>
        <li>Métricas agregadas de utilização (sem conteúdo das perguntas em relatórios internos).</li>
      </ul>
      <h2 className="mb-2 text-lg font-semibold">Armazenamento</h2>
      <p className="mb-4">
        Dados de conta e histórico cloud são processados pelo Supabase (PostgreSQL). O fornecedor
        atua como subprocessador; recomenda-se assinar o DPA em supabase.com/dpa antes do go-live
        com autenticação.
      </p>
      <h2 className="mb-2 text-lg font-semibold">Retenção</h2>
      <p className="mb-4">
        Mantemos os dados até solicitar exclusão ou eliminar a conta. Métricas brutas de analytics
        são arquivadas após 90 dias.
      </p>
      <h2 className="mb-2 text-lg font-semibold">Exclusão de dados</h2>
      <p className="mb-4">
        Utilizadores autenticados podem pedir exclusão via menu de conta (chama{" "}
        <code className="rounded bg-muted px-1">DELETE /runtime/judge/account</code>) ou contacto
        com o operador do serviço.
      </p>
      <p>
        <Link href="/judge" className="text-[hsl(var(--tcg-accent))] underline">
          Voltar ao Judge
        </Link>
      </p>
    </main>
  );
}
