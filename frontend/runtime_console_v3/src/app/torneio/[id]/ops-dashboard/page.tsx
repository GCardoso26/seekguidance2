export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

type Dash = {
  round?: Record<string, unknown>;
  staff?: unknown[];
  penalties?: unknown[];
  standings?: unknown[];
};

async function load(tournamentId: string): Promise<Dash> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(
      `${base}/api/tournament-platform/judge-dashboard?tournament_id=${encodeURIComponent(tournamentId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    return (await res.json()) as Dash;
  } catch {
    return {};
  }
}

export default async function JudgeOpsDashboardPage({ params }: Params) {
  const { id } = await params;
  const data = await load(id);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Judge ops</h1>
      <p className="mt-1 text-sm text-muted-foreground">Tournament {id}</p>

      <section className="mt-8 space-y-6 text-sm">
        <div>
          <h2 className="font-medium">Rodada</h2>
          <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(data.round ?? {}, null, 2)}</pre>
        </div>
        <div>
          <h2 className="font-medium">Staff ({data.staff?.length ?? 0})</h2>
        </div>
        <div>
          <h2 className="font-medium">Penalties ({data.penalties?.length ?? 0})</h2>
        </div>
        <div>
          <h2 className="font-medium">Standings top</h2>
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(data.standings ?? [], null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );
}
