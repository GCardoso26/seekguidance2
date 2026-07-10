"use client";

import { useState } from "react";
import Link from "next/link";
import { useFriends } from "@/hooks/useFriends";
import { FriendCard } from "@/components/social/FriendCard";
import { MobileLayout } from "@/components/layout/MobileLayout";

export default function FriendsPage() {
  const { friends, pendingRequests, isLoading } = useFriends();
  const [tab, setTab] = useState<"friends" | "pending">("friends");

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/social" className="text-sm text-muted-foreground">
          ← Social
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Amigos</h1>

        <div className="mt-6 flex gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setTab("friends")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "friends" ? "border-b-2 border-luxury-gold text-primary" : "text-muted-foreground"
            }`}
          >
            Amigos ({friends.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`px-4 py-2 text-sm font-medium ${
              tab === "pending" ? "border-b-2 border-luxury-gold text-primary" : "text-muted-foreground"
            }`}
          >
            Pendentes ({pendingRequests.length})
          </button>
        </div>

        {isLoading && <p className="mt-6 text-muted-foreground">Carregando…</p>}

        {!isLoading && tab === "friends" && (
          <div className="mt-6 space-y-3">
            {friends.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground/70">Você ainda não tem amigos</p>
            ) : (
              friends.map((friend) => <FriendCard key={friend.id} friend={friend} />)
            )}
          </div>
        )}

        {!isLoading && tab === "pending" && (
          <div className="mt-6 space-y-3">
            {pendingRequests.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground/70">Nenhuma solicitação pendente</p>
            ) : (
              pendingRequests.map((friend) => (
                <FriendCard key={friend.id} friend={friend} type="pending" />
              ))
            )}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
