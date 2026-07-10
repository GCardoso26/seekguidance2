"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
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
import { useQuery } from "@tanstack/react-query";
import type { FeedbackItem } from "@/types/post";
import { computePlayerJudgeStats } from "@/lib/player-judge-stats";
import { BRAZILIAN_STATES } from "@/constants/brazilian-states";
import { TCG_OPTIONS } from "@/types/judge";
import { Award, BarChart3, CreditCard, Flame, History, MessageCircle } from "lucide-react";
import { LigaPassWidget } from "@/components/gamification/LigaPassWidget";
import { ProfileSkeleton } from "@/components/ui/skeletons";
import { cn } from "@/lib/utils";

const TCG_LABELS = Object.fromEntries(TCG_OPTIONS.map((g) => [g.id, g.label]));

type ProfileTab = "overview" | "posts" | "history" | "feedback" | "settings";

export default function MyProfilePage() {
  return (
    <Suspense
      fallback={
        <MobileLayout>
          <ProfileSkeleton />
        </MobileLayout>
      }
    >
      <MyProfilePageContent />
    </Suspense>
  );
}

function MyProfilePageContent() {
  const searchParams = useSearchParams();
  const { user } = useJudgeAuth();
  const { data: profile, isLoading, isError, error } = usePlayerProfile("me");
  const { tier } = useSubscription();
  const { allItems } = useConsultations(user?.id);
  const {
    mutate: updateProfile,
    isPending: isUpdating,
    isSuccess,
    isError: updateError,
    error: updateErrorDetail,
  } = useUpdateProfile();
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [favoriteGame, setFavoriteGame] = useState<GameCode | null>(null);
  const [favoriteTcgs, setFavoriteTcgs] = useState<TcgType[]>([]);
  const [birthDate, setBirthDate] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [streakNotice, setStreakNotice] = useState<string | null>(null);

  const stats = useMemo(
    () => computePlayerJudgeStats(allItems, TCG_LABELS),
    [allItems],
  );

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      void confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    }
  }, [searchParams]);

  useEffect(() => {
    const key = "tcg-judge-last-streak";
    const prev = Number(localStorage.getItem(key) ?? "0");
    if (stats.streakDays === 0 && prev > 1) {
      setStreakNotice(`Seu streak de ${prev} dias acabou. Volte hoje para recomeçar!`);
    } else {
      setStreakNotice(null);
    }
    if (stats.streakDays > 0) {
      localStorage.setItem(key, String(stats.streakDays));
    }
  }, [stats.streakDays]);

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

  const { data: myFeedbacks = [] } = useQuery({
    queryKey: ["my-feedback"],
    queryFn: async () => {
      const res = await fetch("/api/social/feedback/mine");
      if (!res.ok) return [];
      return res.json() as Promise<FeedbackItem[]>;
    },
    enabled: Boolean(profile?.id),
  });

  if (isLoading) {
    return (
      <MobileLayout>
        <ProfileSkeleton />
      </MobileLayout>
    );
  }

  if (isError && error instanceof ProfileNotFoundError) {
    const displayName =
      typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <Link href="/judge" className="text-sm text-muted-foreground">
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
          <Link href="/" className="mt-4 inline-block text-sm text-muted-foreground">
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
        <Link href="/" className="text-sm text-muted-foreground">
          ← Início
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{displayName}</h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          </div>
          <Link
            href="/pricing?from=menu"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary-light"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Plano {tier === "free" ? "Grátis" : tier === "pro" ? "Spike" : "Equipe"}
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="judge-card surface-card p-3 text-center">
            <MessageCircle className="mx-auto h-5 w-5 text-primary" />
            <p className="mt-1 text-lg font-bold">{stats.totalConsultations}</p>
            <p className="text-[10px] text-muted-foreground/70">Consultas</p>
          </div>
          <div className="judge-card surface-card p-3 text-center">
            <BarChart3 className="mx-auto h-5 w-5 text-primary-light" />
            <p className="mt-1 truncate text-sm font-bold">{stats.topTcgLabel ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground/70">TCG favorito</p>
          </div>
          <div className="judge-card surface-card p-3 text-center">
            <Flame className="mx-auto h-5 w-5 text-orange-400" />
            <p className="mt-1 text-lg font-bold">{stats.streakDays}</p>
            <p className="text-[10px] text-muted-foreground/70">Dias seguidos</p>
          </div>
        </div>

        {streakNotice && (
          <p className="mt-4 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm text-orange-200">
            {streakNotice}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <Link
            href="/player/me/history"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted/80"
          >
            <History className="h-4 w-4" />
            Histórico completo
          </Link>
          <Link
            href="/player/me/badges"
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/80"
          >
            <Award className="h-4 w-4" />
            Badges
          </Link>
          <Link
            href="/comunidade/leaderboard"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted/80"
          >
            Ranking
          </Link>
          <Link
            href="/judge"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground"
          >
            Ir para a mesa
          </Link>
        </div>

        <nav className="mt-6 flex flex-wrap gap-2 border-b border-border pb-2">
          {(
            [
              ["overview", "Visão geral"],
              ["posts", "Meus posts"],
              ["history", "Histórico"],
              ["feedback", "Feedback"],
              ["settings", "Configurações"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === id ? "bg-primary/20 text-primary-light" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-6 space-y-6">
          {tab === "overview" && (
            <>
              <LigaPassWidget />
              <Card className="border-border bg-muted/50">
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
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <CardTitle>Posts nas comunidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {myPosts.length === 0 && (
                  <p className="text-sm text-muted-foreground">Você ainda não publicou nada.</p>
                )}
                {myPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "history" && (
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <CardTitle>Histórico de consultas</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsultationHistoryList />
              </CardContent>
            </Card>
          )}

          {tab === "feedback" && (
            <Card className="border-border bg-muted/50">
              <CardHeader>
                <CardTitle>Meus feedbacks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {myFeedbacks.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum feedback enviado.{" "}
                    <Link href="/social/feedback" className="text-primary underline">
                      Enviar feedback
                    </Link>
                  </p>
                )}
                {myFeedbacks.map((f) => (
                  <div key={f.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{f.subject}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      #{f.id.slice(0, 8).toUpperCase()} · {f.status} · {f.priority}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {tab === "settings" && (
            <>
          <Card className="border-border bg-muted/50">
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

          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="handle" className="mb-1 block text-sm text-foreground/90">
                    Handle
                  </label>
                  <Input id="handle" value={profile.handle} disabled className="border-border bg-muted" />
                </div>
                <div>
                  <label htmlFor="displayName" className="mb-1 block text-sm text-foreground/90">
                    Nome de exibição
                  </label>
                  <Input
                    id="displayName"
                    defaultValue={profile.displayName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                    className="border-border bg-muted/50"
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="mb-1 block text-sm text-foreground/90">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    defaultValue={profile.bio ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-border bg-card shadow-card px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <p className="mb-2 text-sm text-foreground/90">Jogos favoritos</p>
                  <MultiSelectTCG selected={favoriteTcgs} onChange={setFavoriteTcgs} />
                </div>
                <div>
                  <p className="mb-2 text-sm text-foreground/90">Jogo principal</p>
                  <GameSelector
                    value={favoriteGame}
                    onChange={(game) => {
                      setFavoriteGame(game);
                      setFormData((prev) => ({ ...prev, favoriteGame: game }));
                    }}
                  />
                </div>
                <div>
                  <label htmlFor="birthDate" className="mb-1 block text-sm text-foreground/90">
                    Data de nascimento
                  </label>
                  <DatePicker value={birthDate} onChange={setBirthDate} />
                </div>
                <div>
                  <label htmlFor="state" className="mb-1 block text-sm text-foreground/90">
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
                {isSuccess && <p className="text-sm text-primary-light">Perfil atualizado.</p>}
                {updateError && (
                  <p className="text-sm text-red-400">
                    {updateErrorDetail instanceof Error ? updateErrorDetail.message : "Erro ao salvar."}
                  </p>
                )}
                <Button type="submit" disabled={isUpdating} className="w-full bg-primary text-primary-foreground">
                  {isUpdating ? "Salvando…" : "Salvar alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/50">
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
