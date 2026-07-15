import Link from "next/link";

export const dynamic = "force-dynamic";

type EventsPayload = {
  events?: Array<{
    id: string;
    name: string;
    status: string;
    starts_at?: string | null;
    game?: string | null;
  }>;
};

async function loadEvents(): Promise<EventsPayload> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${base}/api/tournament-platform/events`, {
      cache: "no-store",
    });
    if (!res.ok) return { events: [] };
    return (await res.json()) as EventsPayload;
  } catch {
    return { events: [] };
  }
}

export default async function SellerEventosPage() {
  const data = await loadEvents();
  const events = data.events ?? [];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Tournament Platform</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Eventos da loja</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Shell RSC do Business Program 2. Torneios operacionais continuam em{" "}
          <Link href="/vendedor/painel/torneios" className="underline">
            Torneios
          </Link>
          .
        </p>
      </header>

      {events.length === 0 ? (
        <p className="text-muted-foreground">Nenhum store event publicado ainda.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li key={ev.id} className="border-b border-border py-3">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="font-medium">{ev.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {ev.game || "—"} · {ev.status}
                    {ev.starts_at ? ` · ${ev.starts_at}` : ""}
                  </p>
                </div>
                <Link
                  href={`/vendedor/painel/eventos/${ev.id}`}
                  className="text-sm underline"
                >
                  Dashboard
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
