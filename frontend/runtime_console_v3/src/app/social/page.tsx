"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ChatDrawer } from "@/components/social/ChatDrawer";
import { CommunityCard } from "@/components/social/CommunityCard";

const qc = new QueryClient();

function SocialPage() {
  const { data: communities = [] } = useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const res = await fetch("/api/social/communities");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const join = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/social/communities/${id}/join`, { method: "POST" });
    },
  });

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Início
        </Link>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link href="/social/friends" className="text-muted-foreground hover:text-white">
            Amigos
          </Link>
          <Link href="/social/communities" className="text-muted-foreground hover:text-white">
            Comunidades
          </Link>
          <Link href="/social/messages" className="text-muted-foreground hover:text-white">
            Mensagens
          </Link>
          <Link href="/social/newsletter" className="text-muted-foreground hover:text-white">
            Newsletter
          </Link>
          <Link href="/social/feedback" className="text-muted-foreground hover:text-white">
            Feedback
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold">Comunidade</h1>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {communities.map((c: Record<string, unknown>) => (
            <CommunityCard
              key={String(c.id)}
              id={String(c.id)}
              name={String(c.name)}
              description={String(c.description ?? "")}
              gameCode={String(c.game_code ?? "")}
              memberCount={Number(c.member_count ?? 0)}
              onJoin={() => join.mutate(String(c.id))}
            />
          ))}
        </div>
      </div>
      <ChatDrawer />
    </MobileLayout>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <SocialPage />
    </QueryClientProvider>
  );
}
