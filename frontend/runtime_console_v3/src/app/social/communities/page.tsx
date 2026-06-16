"use client";

import Link from "next/link";
import { useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { CommunityCard } from "@/components/social/CommunityCard";
import { CreateCommunityModal } from "@/components/social/CreateCommunityModal";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { PostCard } from "@/components/community/PostCard";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import type { PostSort } from "@/types/post";
import { cn } from "@/lib/utils";

const SORTS: { id: PostSort; label: string }[] = [
  { id: "hot", label: "Em alta" },
  { id: "new", label: "Novos" },
  { id: "top", label: "Top" },
];

export default function CommunitiesPage() {
  const { data: communities = [], isLoading } = useCommunities();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PostSort>("hot");
  const { data: posts = [], isLoading: postsLoading } = useCommunityPosts({ sort });

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Link href="/social" className="text-sm text-luxury-mist">
          ← Social
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">Suas comunidades</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {communities.slice(0, 8).map((c) => (
                <li key={c.id}>
                  <Link href={`/social/communities/${c.id}`} className="text-luxury-frost hover:text-luxury-gold">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CreateCommunityModal />
            </div>
          </aside>

          <main className="lg:col-span-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-light text-luxury-frost">Comunidades</h1>
                <p className="mt-1 text-luxury-mist">Discussões sobre TCG</p>
              </div>
              <CreatePostModal />
            </div>

            <div className="mt-4 flex gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    sort === s.id
                      ? "bg-luxury-gold/20 text-luxury-gold-light"
                      : "border border-white/10 text-luxury-mist",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {postsLoading && <p className="text-luxury-mist">Carregando feed…</p>}
              {!postsLoading && posts.length === 0 && (
                <p className="text-center text-luxury-mist/70">Nenhum post ainda. Seja o primeiro!</p>
              )}
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </main>

          <aside className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">Populares</h2>
            <Input
              placeholder="Buscar comunidades…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 border-white/10 bg-white/5"
            />
            {isLoading && <p className="mt-4 text-sm text-luxury-mist">Carregando…</p>}
            <div className="mt-4 space-y-3">
              {filtered.slice(0, 6).map((community) => (
                <CommunityCard
                  key={community.id}
                  id={community.id}
                  name={community.name}
                  description={community.description}
                  gameCode={community.game_code}
                  memberCount={community.member_count}
                />
              ))}
            </div>
            <div className="mt-4 lg:hidden">
              <CreateCommunityModal />
            </div>
          </aside>
        </div>
      </div>
    </MobileLayout>
  );
}
