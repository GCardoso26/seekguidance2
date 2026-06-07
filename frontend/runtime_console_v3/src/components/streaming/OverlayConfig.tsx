"use client";

type Props = { tournamentId: string };

export function OverlayConfig({ tournamentId }: Props) {
  const base = typeof window !== "undefined" ? window.location.origin : "https://tcg-judge.com";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || base.replace(":3000", ":8000");

  const overlays = [
    { name: "Standings", url: `${apiBase}/overlay/${tournamentId}/standings` },
    { name: "Standings HTML", url: `${apiBase}/overlay/templates/standings.html?id=${tournamentId}&api=${apiBase}` },
    { name: "Pairings", url: `${apiBase}/overlay/${tournamentId}/pairings` },
    { name: "Timer", url: `${apiBase}/overlay/${tournamentId}/timer` },
    { name: "Bracket", url: `${apiBase}/overlay/${tournamentId}/bracket` },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">URLs para OBS</h3>
      {overlays.map((o) => (
        <div key={o.name} className="flex flex-col gap-2 rounded-lg bg-slate-800 p-3 sm:flex-row sm:items-center">
          <span className="w-28 font-medium">{o.name}</span>
          <code className="flex-1 truncate rounded bg-slate-900 px-2 py-1 text-xs">{o.url}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(o.url)}
            className="min-h-[44px] text-sm text-blue-400"
          >
            Copiar
          </button>
        </div>
      ))}
      <p className="text-sm text-slate-400">
        Adicione como Browser Source no OBS. Atualização em tempo real via WebSocket.
      </p>
    </div>
  );
}
