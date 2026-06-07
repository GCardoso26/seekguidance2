"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { GameCode } from "@/lib/tcg-adapters";
import { AvatarUpload } from "@/components/player/AvatarUpload";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { GameSelector } from "@/components/tournament/GameSelector";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useUpdateProfile, type UpdateProfileData } from "@/hooks/useUpdateProfile";

export default function MyProfilePage() {
  const { data: profile, isLoading, isError } = usePlayerProfile("me");
  const { mutate: updateProfile, isPending: isUpdating, isSuccess, isError: updateError } =
    useUpdateProfile();
  const [formData, setFormData] = useState<UpdateProfileData>({});
  const [favoriteGame, setFavoriteGame] = useState<GameCode | null>(null);

  useEffect(() => {
    if (profile?.favoriteGame) {
      setFavoriteGame(profile.favoriteGame as GameCode);
    }
  }, [profile?.favoriteGame]);

  if (isLoading) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8 text-slate-400">Carregando perfil…</div>
      </MobileLayout>
    );
  }

  if (isError || !profile) {
    return (
      <MobileLayout>
        <div className="container mx-auto px-4 py-8">
          <p className="text-red-400">Erro ao carregar perfil. Faça login e crie seu perfil primeiro.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-slate-400">
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
    });
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/" className="text-sm text-slate-400">
          ← Início
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Meu Perfil</h1>

        <div className="mt-6 space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
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

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="handle" className="mb-1 block text-sm text-slate-300">
                    Handle
                  </label>
                  <Input id="handle" value={profile.handle} disabled className="border-slate-600 bg-slate-900" />
                  <p className="mt-1 text-xs text-slate-500">Handle não pode ser alterado</p>
                </div>

                <div>
                  <label htmlFor="displayName" className="mb-1 block text-sm text-slate-300">
                    Nome de exibição
                  </label>
                  <Input
                    id="displayName"
                    defaultValue={profile.displayName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
                    className="border-slate-600 bg-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="mb-1 block text-sm text-slate-300">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    defaultValue={profile.bio ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm text-slate-300">Jogo favorito</p>
                  <GameSelector
                    value={favoriteGame}
                    onChange={(game) => {
                      setFavoriteGame(game);
                      setFormData((prev) => ({ ...prev, favoriteGame: game }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="mb-1 block text-sm text-slate-300">
                      Cidade
                    </label>
                    <Input
                      id="city"
                      defaultValue={profile.location?.city ?? ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                      className="border-slate-600 bg-slate-800"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="mb-1 block text-sm text-slate-300">
                      País
                    </label>
                    <Input
                      id="country"
                      defaultValue={profile.location?.country ?? ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                      className="border-slate-600 bg-slate-800"
                    />
                  </div>
                </div>

                {isSuccess && <p className="text-sm text-emerald-400">Perfil atualizado com sucesso.</p>}
                {updateError && <p className="text-sm text-red-400">Erro ao salvar alterações.</p>}

                <Button type="submit" disabled={isUpdating} className="w-full bg-amber-500 text-slate-900">
                  {isUpdating ? "Salvando…" : "Salvar alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Preferências de notificação</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationPreferences />
            </CardContent>
          </Card>
        </div>
      </div>
    </MobileLayout>
  );
}
