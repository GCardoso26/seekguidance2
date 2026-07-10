import { User } from "lucide-react";

type Player = { name: string; avatar?: string; points?: number };

type Props = {
  tableNumber: number;
  player1: Player;
  player2?: Player;
  timerRemaining?: string;
  onReport?: () => void;
};

export function MobilePairingCard({ tableNumber, player1, player2, timerRemaining, onReport }: Props) {
  return (
    <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/60 p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
        <span>Mesa {tableNumber}</span>
        {timerRemaining && <span className="text-warning">{timerRemaining}</span>}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
            <User className="h-6 w-6 text-slate-400" aria-hidden />
          </div>
          <p className="mt-1 text-sm font-medium">{player1.name}</p>
          <p className="text-xs text-slate-500">{player1.points ?? 0} pts</p>
        </div>
        <div className="text-xl font-bold text-slate-500">VS</div>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-700">
            <User className="h-6 w-6 text-slate-400" aria-hidden />
          </div>
          <p className="mt-1 text-sm font-medium">{player2?.name ?? "Bye"}</p>
          <p className="text-xs text-slate-500">{player2?.points ?? "-"} pts</p>
        </div>
      </div>
      {onReport && (
        <button
          type="button"
          onClick={onReport}
          className="mt-3 min-h-[44px] w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-foreground"
        >
          Reportar resultado
        </button>
      )}
    </div>
  );
}
