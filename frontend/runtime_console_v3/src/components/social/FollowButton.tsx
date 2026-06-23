"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserMinus, UserPlus } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

type Props = {
  playerId: string;
  initialFollowerCount?: number;
};

export function FollowButton({ playerId, initialFollowerCount = 0 }: Props) {
  const { user } = useJudgeAuth();
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["follow-stats", playerId],
    queryFn: async () => {
      const res = await fetch(`/api/social/follows/${encodeURIComponent(playerId)}`);
      if (!res.ok) return { following: false, followerCount: initialFollowerCount };
      return res.json() as Promise<{ following: boolean; followerCount: number }>;
    },
    enabled: Boolean(playerId),
  });

  const toggle = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/follows/${encodeURIComponent(playerId)}`, { method: "POST" });
      if (!res.ok) throw new Error("Faça login para seguir");
      return res.json() as Promise<{ following: boolean }>;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["follow-stats", playerId] });
      const prev = qc.getQueryData<{ following: boolean; followerCount: number }>(["follow-stats", playerId]);
      qc.setQueryData(["follow-stats", playerId], {
        following: !prev?.following,
        followerCount: (prev?.followerCount ?? 0) + (prev?.following ? -1 : 1),
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["follow-stats", playerId], ctx.prev);
      showToast("Faça login para seguir jogadores", "error");
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ["follow-stats", playerId] }),
  });

  if (!user || user.id === playerId) return null;

  const following = stats?.following ?? false;
  const count = stats?.followerCount ?? initialFollowerCount;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        variant="outline"
        className="min-h-[44px] border-white/10 focus-visible:ring-2 focus-visible:ring-luxury-gold"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate()}
        aria-pressed={following}
      >
        {toggle.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : following ? (
          <UserMinus className="mr-2 h-4 w-4" strokeWidth={1.5} />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" strokeWidth={1.5} />
        )}
        {following ? "Seguindo" : "Seguir"}
      </Button>
      <span className="text-sm text-luxury-mist">{count} seguidores</span>
    </div>
  );
}
