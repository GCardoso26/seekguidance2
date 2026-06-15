import { FriendButton } from "@/components/social/FriendButton";
import { AchievementBadge } from "./AchievementBadge";
import { RankingDisplay } from "./RankingDisplay";
import { StatsCard } from "./StatsCard";
import { TournamentHistory } from "./TournamentHistory";
import type { PlayerProfile as Profile } from "@/hooks/usePlayerProfile";

type Props = {
  profile: Profile;
  showFriendButton?: boolean;
};

export function PlayerProfile({ profile, showFriendButton }: Props) {
  const stats = profile.stats ?? [];
  const totalWins = stats.reduce((s, g) => s + Number(g.tournaments_won ?? 0), 0);
  const totalTournaments = stats.reduce((s, g) => s + Number(g.tournaments_played ?? 0), 0);
  const achievements = profile.achievements ?? [];

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 text-3xl">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            "👤"
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">@{profile.handle}</h1>
          <p className="text-luxury-frost/90">{profile.displayName}</p>
          {profile.bio && <p className="mt-2 text-sm text-luxury-mist">{profile.bio}</p>}
          {profile.location?.city && (
            <p className="mt-1 text-sm text-luxury-mist/70">
              {profile.location.city}, {profile.location.country}
            </p>
          )}
          {showFriendButton && profile.id && (
            <div className="mt-3">
              <FriendButton playerId={String(profile.id)} />
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-4">
        <StatsCard icon="🏆" label="Torneios Ganhos" value={totalWins} />
        <StatsCard icon="🎮" label="Torneios" value={totalTournaments} />
        <StatsCard icon="⭐" label="Conquistas" value={achievements.length} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Rankings</h2>
        <RankingDisplay rankings={(profile.rankings ?? []) as Parameters<typeof RankingDisplay>[0]["rankings"]} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Últimos torneios</h2>
        <TournamentHistory items={(profile.recentTournaments ?? []) as Parameters<typeof TournamentHistory>[0]["items"]} />
      </section>

      {achievements.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Conquistas</h2>
          <div className="flex flex-wrap gap-2">
            {achievements.map((a, i) => (
              <AchievementBadge
                key={i}
                name={String(a.name ?? a.code)}
                icon={String(a.icon ?? "")}
                rarity={String(a.rarity ?? "common")}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
