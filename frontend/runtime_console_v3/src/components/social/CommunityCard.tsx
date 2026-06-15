type Props = {
  name: string;
  description?: string;
  gameCode?: string;
  memberCount?: number;
  onJoin?: () => void;
};

export function CommunityCard({ name, description, gameCode, memberCount, onJoin }: Props) {
  return (
    <article className="rounded-xl border border-white/10 p-4">
      <h3 className="font-semibold">{name}</h3>
      {gameCode && <p className="text-xs text-luxury-mist">{gameCode}</p>}
      {description && <p className="mt-2 text-sm text-luxury-frost/90">{description}</p>}
      <p className="mt-2 text-xs text-luxury-mist/70">{memberCount ?? 0} membros</p>
      {onJoin && (
        <button
          type="button"
          onClick={onJoin}
          className="mt-3 min-h-[44px] rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
        >
          Entrar
        </button>
      )}
    </article>
  );
}
