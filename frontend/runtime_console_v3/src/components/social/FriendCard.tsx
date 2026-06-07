"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FriendProfile } from "@/hooks/useFriends";
import { Button } from "@/components/ui/button";

type Props = {
  friend: FriendProfile;
  type?: "friend" | "pending";
};

export function FriendCard({ friend, type = "friend" }: Props) {
  const qc = useQueryClient();

  const accept = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/friends/${encodeURIComponent(friend.id)}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao aceitar");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friends-pending"] });
    },
  });

  return (
    <article className="flex items-center justify-between rounded-xl border border-slate-700 p-4">
      <div>
        <Link href={`/player/${friend.handle}`} className="font-semibold hover:text-amber-400">
          @{friend.handle}
        </Link>
        <p className="text-sm text-slate-400">{friend.display_name}</p>
      </div>
      {type === "pending" ? (
        <Button
          type="button"
          size="sm"
          disabled={accept.isPending}
          onClick={() => accept.mutate()}
          className="bg-amber-500 text-slate-900 hover:opacity-90"
        >
          Aceitar
        </Button>
      ) : (
        friend.unread ? (
          <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-300">
            {friend.unread} não lidas
          </span>
        ) : null
      )}
    </article>
  );
}
