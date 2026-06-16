"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { GameCode } from "@/lib/tcg-adapters";
import type { TcgType } from "@/types/judge";
import { AvatarUpload } from "@/components/player/AvatarUpload";
import { ConsultationHistoryList } from "@/components/player/ConsultationHistoryList";
import { PostCard } from "@/components/community/PostCard";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { GameSelector } from "@/components/tournament/GameSelector";
import { DatePicker } from "@/components/ui/DatePicker";
import { MultiSelectTCG } from "@/components/ui/MultiSelectTCG";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlayerProfile, ProfileNotFoundError } from "@/hooks/usePlayerProfile";
import { CreatePlayerProfileForm } from "@/components/player/CreatePlayerProfileForm";
import { useUpdateProfile, type UpdateProfileData } from "@/hooks/useUpdateProfile";
import { useConsultations } from "@/hooks/useConsultations";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { computePlayerJudgeStats } from "@/lib/player-judge-stats";
import { BRAZILIAN_STATES } from "@/constants/brazilian-states";
import { TCG_OPTIONS } from "@/types/judge";
import { BarChart3, CreditCard, Flame, History, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TCG_LABELS = Object.fromEntries(TCG_OPTIONS.map((g) => [g.id, g.label]));

type ProfileTab = "overview" | "posts" | "history" | "settings";

export default function MyProfilePage() {
  const { user } = useJudgeAuth();
  const { data: profile, isLoading, isError, error } = usePlayerProfile("me");
  const { tier } = useSubscription();
  const { allItems } = useConsultations(user?.id);
  const { mutate: updateProfile, isPending: isUpdating, isSuccess, isError: updateError } =
    useUpdateProfile();
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [favoriteGame, setFavoriteGame] = useState<GameCode | null>(null);
  const [favoriteTcgs, setFavoriteTcgs] = useState<TcgType[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [tab, setTab] = useState<ProfileTab>("overview");

  const stats = useMemo(
    () => computePlayerJudgeStats(allItems, TCG_LABELS),
    [allItems],
  );

  useEffect(() => {
    if (profile?.favoriteGame) {
      setFavoriteGame(profile.favoriteGame as GameCode);
    }
    if (profile?.favoriteTcgs?.length) {
      setFavoriteTcgs(profile.favoriteTcgs as TcgType[]);
    }
    if (profile?.birthDate) setBirthDate(profile.birthDate.slice(0, 10));
    if (profile?.state) setStateCode(profile.state);
    else if (profile?.location?.state) setStateCode(profile.location.state);
  }, [profile?.favoriteGame, profile?.favoriteTcgs, profile?.birthDate, profile?.state, profile?.location?.state]);

  const { data: myPosts = [] } = useCommunityPosts({
    authorId: profile?.id,
    sort: "new",
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8 text-luxury-mist">Carregando perfil…</div>
      </MobileLayout>
    );
  }

  if (isError && error instanceof ProfileNotFoundError) {
    const displayName =
      typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <Link href="/judge" className="text-sm text-luxury-mist">
            ← Mesa de regras
          </Link>
          <div className="mt-6">
            <CreatePlayerProfileForm email={user?.email} defaultDisplayName={displayName} />
          </div>
        </div>
      </MobileLayout>
    );
  }

  if (isError || !profile) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-400">Erro ao carregar perfil. Faça login e crie seu perfil primeiro.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-luxury-mist">
            ← Início
          </Link>
        </div>
      </MobileLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ...formData,
      favoriteGame: favoriteGame ?? formData.favoriteGame,
      favoriteTcgs,
      birthDate: birthDate || undefined,
      state: stateCode || undefined,
    });
  };

  const displayName =
    profile.displayName ||
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ||
    profile.handle;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-luxury-mist">
          ← Início
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-sm text-luxury-mist">@{profile.handle}</p>
          </div>
          <Link
            href="/pricing?from=menu"
            className="inline-flex items-center gap-1.5 rounded-lg border border-luxury-gold/40 bg-luxury-gold/10 px-3 py-1.5 text-xs font-semibold text-luxury-gold-light"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Plano {tier === "free" ? "Grátis" : tier === "pro" ? "Spike" : "Equipe"}
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="judge-card rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <MessageCircle className="mx-auto h-5 w-5 text-luxury-gold" />
            <p className="mt-1 text-lg font-bold">{stats.totalConsultations}</p>
            <p className="text-[10px] text-luxury-mist/70">Consultas</p>
          </div>
          <div className="judge-card rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <BarChart3 className="mx-auto h-5 w-5 text-luxury-gold-light" />
            <p className="mt-1 truncate text-sm font-bold">{stats.topTcgLabel ?? "—"}</p>
            <p className="text-[10px] text-luxury-mist/70">TCG favorito</p>
          </div>
          <div className="judge-card rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <Flame className="mx-auto h-5 w-5 text-orange-400" />
            <p className="mt-1 text-lg font-bold">{stats.streakDays}</p>
            <p className="text-[10px] text-luxury-mist/70">Dias seguidos</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href="/player/me/history"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-sm font-medium text-luxury-frost hover:bg-white/5"
          >
            <History className="h-4 w-4" />
            Histórico completo
          </Link>
          <Link
            href="/judge"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-luxury-gold py-2 text-sm font-semibold text-luxury-onyx"
          >
            Ir para a mesa
          </Link>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-2">
          {(
            [
              ["overview", "Visão geral"],
              ["posts", "Meus posts"],
              ["history", "Histórico"],
              ["settings", "Configurações"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === id ? "bg-luxury-gold/20 text-luxury-gold-light" : "text-luxury-mist",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-6">
          {tab === "overview" && (
            <>
              <Card className="border-white/10 bg-white/5">
                <CardHeader>
                  <CardTitle>Consultas recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConsultationHistoryList compact />
                </CardContent>
              </Card>
            </>
          )}

          {tab === "posts" && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Posts nas comunidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPosts.length === 0 && (
                  <p className="text-sm text-luxury-mist">Você ainda não publicou nada.</p>
                )}
                {myPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "history" && (
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Histórico de consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsultationHistoryList />
              </CardContent>
            </Card>
          )}

          {tab === "settings" && (
            <>
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Foto de Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload
                currentUrl={profile.avatarUrl}
                onUpload={(url) => setFormData((prev) => ({ ...prev, avatarUrl: url }))}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="handle" className="mb-1 block text-sm text-luxury-frost/90">
                    Handle
                  </label>
                  <Input id="handle" value={profile.handle} disabled className="border-white/10 bg-luxury-midnight" />
                </div>
                <div>
                  <label htmlFor="displayName" className="mb-1 block text-sm text-luxury-frost/90">
                    Nome de exibição
                  </label>
                  <Input
                    id="displayName"
                    defaultValue={profile.displayName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                    className="border-white/10 bg-white/5"
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="mb-1 block text-sm text-luxury-frost/90">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    defaultValue={profile.bio ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm text-luxury-frost/90">Jogos favoritos</p>
                  <MultiSelectTCG selected={favoriteTcgs} onChange={setFavoriteTcgs} />
                </div>
                <div>
                  <p className="mb-2 text-sm text-luxury-frost/90">Jogo principal</p>
                  <GameSelector
                    value={favoriteGame}
                    onChange={(game) => {
                      setFavoriteGame(game);
                      setFormData((prev) => ({ ...prev, favoriteGame: game }));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="birthDate" className="mb-1 block text-sm text-luxury-frost/90">
                    Data de nascimento
                  </label>
                  <DatePicker value={birthDate} onChange={setBirthDate} />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1 block text-sm text-luxury-frost/90">
                    Estado
                  </label>
                  <select
                    id="state"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="luxury-input w-full"
                  >
                    <option value="">Selecione</option>
                    {BRAZILIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                {isSuccess && <p className="text-sm text-luxury-gold-light">Perfil atualizado.</p>}
                {updateError && <p className="text-sm text-red-400">Erro ao salvar.</p>}
                <Button type="submit" disabled={isUpdating} className="w-full bg-luxury-gold text-luxury-onyx">
                  {isUpdating ? "Salvando…" : "Salvar alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
