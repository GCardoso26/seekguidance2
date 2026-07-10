"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PostCard } from "@/components/community/PostCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";

const qc = new QueryClient();

function ProfilePage() {
  const params = useParams();
  const handle = String(params.handle ?? "");
  const { data, isLoading, isError } = usePlayerProfile(handle);
  const { data: posts = [] } = useCommunityPosts({
    authorId: data?.id,
    sort: "new",
  });

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Início
          </Link>
          <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground">
            Descobrir torneios
          </Link>
        </div>
        {isLoading && <p className="text-muted-foreground">Carregando perfil…</p>}
        {isError && <p className="text-danger">Jogador não encontrado.</p>}
        {data && <PlayerProfile profile={data} showFriendButton />}
        {data && posts.length > 0 && (
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Posts públicos</h2>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        )}
      </div>
    </MobileLayout>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>
  );
}
