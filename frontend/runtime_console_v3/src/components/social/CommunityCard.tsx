import Link from "next/link";

type Props = {
  id: string;
  name: string;
  description?: string;
  gameCode?: string;
  memberCount?: number;
  onJoin?: () => void;
};

export function CommunityCard({ id, name, description, gameCode, memberCount, onJoin }: Props) {
  return (
    <article className="rounded-xl border border-border p-4 transition hover:border-primary/30">
      <Link href={`/social/communities/${id}`}>
        <h3 className="font-semibold text-foreground hover:text-primary">{name}</h3>
      </Link>
      {gameCode && <p className="text-xs text-muted-foreground">{gameCode}</p>}
      {description && <p className="mt-2 line-clamp-2 text-sm text-foreground/90">{description}</p>}
      <p className="mt-2 text-xs text-muted-foreground/70">{memberCount ?? 0} membros</p>
      {onJoin && (
        <button
          type="button"
          onClick={onJoin}
          className="mt-3 min-h-[44px] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Entrar
        </button>
      )}
    </article>
  );
}
