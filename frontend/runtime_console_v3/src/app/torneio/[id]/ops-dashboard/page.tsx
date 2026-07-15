import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * BP5: shells de “runtime” não podem parecer debug JSON.
 * Encaminha o juiz para a operação real do torneio.
 */
export default async function JudgeOpsDashboardPage({ params }: Params) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Operação do torneio</h1>
      <p className="text-body text-muted-foreground">
        Use a tela de operação para check-in, mesas, resultados e classificação — sem painéis técnicos.
      </p>
      <Link
        href={`/tournament/${id}`}
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-4 text-body font-semibold text-primary-foreground"
      >
        Abrir operação do torneio
      </Link>
      <Link href="/vendedor/painel/eventos" className="text-center text-small text-primary underline">
        Voltar aos eventos
      </Link>
    </main>
  );
}
