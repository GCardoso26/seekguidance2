"use client";

type Props = {
  activeGames: string[];
};

export function JudgeAlertBanner({ activeGames }: Props) {
  if (activeGames.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900"
    >
      <p className="font-semibold">Alerta de qualidade Judge</p>
      <p className="mt-1">
        👎 acima de 20% nas últimas 48h:{" "}
        <span className="font-mono uppercase">{activeGames.join(", ")}</span>
      </p>
    </div>
  );
}
