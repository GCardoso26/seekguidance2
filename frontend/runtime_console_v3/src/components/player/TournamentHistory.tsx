type Entry = {
  tournament_name?: string;
  game_code?: string;
  placement?: number;
  total_participants?: number;
  points_earned?: number;
  created_at?: string;
};

type Props = {
  items: Entry[];
};

function medal(place: number) {
  if (place === 1) return "🥇";
  if (place === 2) return "🥈";
  if (place === 3) return "🥉";
  return `${place}º`;
}

export function TournamentHistory({ items }: Props) {
  if (!items.length) {
    return <p className="text-sm text-luxury-mist">Nenhum torneio registrado.</p>;
  }

  return (
    <ul className="divide-y divide-slate-700 rounded-lg border border-white/10">
      {items.map((t, i) => (
        <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <span className="mr-2">{medal(t.placement ?? 0)}</span>
            <span className="font-medium">{t.tournament_name ?? "Torneio"}</span>
            <span className="ml-2 text-luxury-mist">{t.game_code}</span>
          </div>
          <div className="text-luxury-mist">
            {t.placement}º/{t.total_participants} · +{t.points_earned} pts
          </div>
        </li>
      ))}
    </ul>
  );
}
