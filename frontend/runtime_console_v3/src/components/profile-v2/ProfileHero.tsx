"use client";

import Link from "next/link";
import { Award, MapPin, Share2 } from "lucide-react";
import type { PlayerProfile } from "@/hooks/usePlayerProfile";
import type { GamificationProfile } from "@/types/gamification-profile";
import type { PlayerBadge } from "@/lib/profile-badges";
import type { PlayerAchievement } from "@/lib/profile-achievements";
import { publicProfilePath } from "@/lib/profile-v2";
import { formatCurrency } from "@/lib/format-currency";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Props = {
  profile?: PlayerProfile | null;
  gamification?: GamificationProfile | null;
  badges?: PlayerBadge[];
  achievements?: PlayerAchievement[];
  collectionValue?: number | null;
  currency?: string;
  memberSince?: string | null;
  loading?: boolean;
  isOwner?: boolean;
};

export function ProfileHero({
  profile,
  gamification,
  badges = [],
  achievements = [],
  collectionValue,
  currency = "BRL",
  memberSince,
  loading,
  isOwner = true,
}: Props) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border" data-testid="profile-hero-skeleton">
        <Skeleton className="h-28 w-full sm:h-36" />
        <div className="space-y-3 p-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const earnedBadges = badges.filter((b) => b.earned).slice(0, 6);
  const unlocked = achievements.filter((a) => a.unlocked).slice(0, 4);
  const city = profile.location?.city;
  const state = profile.state ?? profile.location?.state;
  const games = [
    ...(profile.favoriteGame ? [profile.favoriteGame] : []),
    ...(profile.favoriteTcgs ?? []),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}${publicProfilePath(profile.handle)}`
    : publicProfilePath(profile.handle);

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white"
      data-testid="profile-hero"
      aria-label="Identidade do jogador"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(45,212,191,0.35), transparent), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(56,189,248,0.2), transparent)",
        }}
        aria-hidden
      />
      <div className="relative h-24 bg-black/20 sm:h-32" aria-hidden />
      <div className="relative -mt-10 flex flex-col gap-5 px-5 pb-6 sm:flex-row sm:items-end sm:px-7 sm:pb-7">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl || "/brand/mark.svg"}
            alt=""
            className="h-20 w-20 rounded-full border-4 border-slate-900 object-cover shadow-lg sm:h-24 sm:w-24"
          />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {profile.displayName || profile.handle}
            </h1>
            <span className="text-sm text-white/70">@{profile.handle}</span>
          </div>
          {profile.bio ? (
            <p className="max-w-2xl text-sm text-white/80">{profile.bio}</p>
          ) : isOwner ? (
            <p className="text-sm text-white/55">Adicione uma bio nas configurações.</p>
          ) : null}
          <div className="flex flex-wrap gap-3 text-caption text-white/65">
            {(city || state) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {[city, state].filter(Boolean).join(", ")}
              </span>
            )}
            {memberSince ? (
              <span>Membro desde {new Date(memberSince).toLocaleDateString("pt-BR")}</span>
            ) : null}
            {gamification ? (
              <span className="inline-flex items-center gap-1">
                <Award className="h-3.5 w-3.5" aria-hidden />
                Nível {gamification.current_level} · {gamification.total_xp} XP
              </span>
            ) : null}
            {collectionValue != null ? (
              <span>Coleção {formatCurrency(collectionValue, currency)}</span>
            ) : null}
          </div>
          {games.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {games.map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-white/10 px-2 py-0.5 text-caption text-white/90"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : null}
          {(earnedBadges.length > 0 || unlocked.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {earnedBadges.map((b) => (
                <span
                  key={b.id}
                  className="rounded-md border border-teal-400/30 bg-teal-500/15 px-2 py-0.5 text-caption text-teal-100"
                  title={b.description}
                >
                  {b.title}
                </span>
              ))}
              {unlocked.map((a) => (
                <span
                  key={a.id}
                  className="rounded-md border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-caption text-sky-100"
                  title={a.description}
                >
                  {a.title}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {isOwner ? (
            <>
              <Button asChild variant="secondary" size="sm" className="bg-white/15 text-white hover:bg-white/25">
                <Link href="/perfil/configuracoes">Editar</Link>
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="bg-white/15 text-white hover:bg-white/25"
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl);
                }}
              >
                <Share2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                Compartilhar
              </Button>
            </>
          ) : (
            <Button asChild variant="secondary" size="sm" className="bg-white/15 text-white hover:bg-white/25">
              <Link href={publicProfilePath(profile.handle)}>Perfil público</Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
