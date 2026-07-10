"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

async function fetchCommunity(id: string) {
  const res = await fetch(`/api/social/communities/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Comunidade não encontrada");
  return res.json() as Promise<Record<string, unknown>>;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { data: community, isLoading } = useQuery({
    queryKey: ["community", id],
    queryFn: () => fetchCommunity(id),
  });
  const { data: posts = [], isLoading: postsLoading } = useCommunityPosts({ communityId: id });

  const join = async () => {
    await fetch(`/api/social/communities/${id}/join`, { method: "POST" });
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/social/communities" className="text-sm text-muted-foreground">
          ← Comunidades
        </Link>

        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}

        {community && (
          <header className="luxury-card mt-4 rounded-xl p-6">
            <h1 className="text-2xl font-light text-foreground">{String(community.name)}</h1>
            {typeof community.description === "string" && community.description.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">{community.description}</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground/70">{String(community.member_count ?? 0)} membros</p>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                className="bg-primary text-primary-foreground"
                onClick={() => void join()}
              >
                Entrar
              </Button>
              <CreatePostModal defaultCommunityId={id} />
            </div>
          </header>
        )}

        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-medium text-foreground">Posts</h2>
          {postsLoading && <p className="text-muted-foreground">Carregando posts…</p>}
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </section>
      </div>
    </MobileLayout>
  );
}
