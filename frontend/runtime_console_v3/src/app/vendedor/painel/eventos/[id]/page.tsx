import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

type Dash = {
  kpis?: Record<string, number | string | null | undefined>;
  event?: { name?: string; status?: string } | null;
};

async function loadDashboard(eventId: string): Promise<Dash> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(
      `${base}/api/tournament-platform/event-dashboard?store_event_id=${encodeURIComponent(eventId)}`,
      { cache: "no-store" },
    );
    if (!res.ok) return {};
    return (await res.json()) as Dash;
  } catch {
    return {};
  }
}

export default async function EventDashboardPage({ params }: Params) {
  const { id } = await params;
  const data = await loadDashboard(id);
  const kpis = data.kpis ?? {};

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Link href="/vendedor/painel/eventos" className="text-sm underline">
        ← Eventos
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {data.event?.name ?? "Event dashboard"}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{data.event?.status}</p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {Object.entries(kpis).map(([key, value]) => (
          <div key={key}>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{key}</p>
            <p className="text-xl font-medium">{value ?? "—"}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
