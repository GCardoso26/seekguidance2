export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

type Dash = {
  registration?: Record<string, unknown> | null;
  qr_code?: string | null;
  standing?: Record<string, unknown> | null;
  current_round?: number | null;
};

async function load(tournamentId: string): Promise<Dash> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(
      `${base}/api/tournament-platform/player-dashboard?tournament_id=${encodeURIComponent(tournamentId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    return (await res.json()) as Dash;
  } catch {
    return {};
  }
}

export default async function PlayerEventPage({ params }: Params) {
  const { id } = await params;
  const data = await load(id);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Meu evento</h1>
      <p className="mt-2 text-sm text-muted-foreground">Player dashboard (Tournament Platform)</p>

      <section className="mt-8 space-y-4 text-sm">
        <p>
          Status inscrição:{" "}
          <strong>{String(data.registration?.status ?? "—")}</strong>
        </p>
        <p>QR: {data.qr_code ?? "—"}</p>
        <p>Rodada: {data.current_round ?? "—"}</p>
        <p>Posição: {data.standing ? JSON.stringify(data.standing) : "—"}</p>
      </section>
    </main>
  );
}
