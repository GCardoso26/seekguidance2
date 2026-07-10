import type { TournamentPublicStatus } from "@/types/tournament-registration";
import { publicStatusLabel } from "@/lib/tournament-registration";

const STYLES: Record<TournamentPublicStatus, string> = {
  open: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  finished: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

type Props = {
  status: TournamentPublicStatus;
};

export function TournamentPublicStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${STYLES[status]}`}
      data-testid="tournament-public-status"
    >
      {publicStatusLabel(status)}
    </span>
  );
}
