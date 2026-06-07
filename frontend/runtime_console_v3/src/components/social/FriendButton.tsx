"use client";

import { useFriendship } from "@/hooks/useFriendship";

export function FriendButton({ playerId }: { playerId: string }) {
  const { status, sendRequest, acceptRequest, removeFriend } = useFriendship(playerId);

  if (status === "accepted") {
    return (
      <button
        type="button"
        onClick={() => removeFriend.mutate()}
        className="min-h-[44px] rounded-lg border border-slate-600 px-4 py-2 text-sm"
      >
        Remover amigo
      </button>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <span className="text-sm text-slate-400">Solicitação pendente</span>
        <button
          type="button"
          onClick={() => acceptRequest.mutate()}
          className="min-h-[44px] rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white"
        >
          Aceitar
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => sendRequest.mutate()}
      disabled={sendRequest.isPending}
      className="min-h-[44px] rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
    >
      Adicionar amigo
    </button>
  );
}
