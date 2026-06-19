"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCommunities } from "@/hooks/useCommunities";
import { CommunityCard } from "@/components/social/CommunityCard";
import { CreateCommunityModal } from "@/components/social/CreateCommunityModal";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { InfinitePostFeed } from "@/components/community/InfinitePostFeed";
import { FeedSorter } from "@/components/community/FeedSorter";
import { NotificationBell } from "@/components/social/NotificationBell";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Input } from "@/components/ui/input";
import type { PostSort, TopPeriod } from "@/types/post";

export default function CommunitiesPageClient() {
  const searchParams = useSearchParams();
  const tag = searchParams.get("tag") ?? undefined;
  const { data: communities = [], isLoading } = useCommunities();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<PostSort>("hot");
  const [period, setPeriod] = useState<TopPeriod>("week");
  const [feed, setFeed] = useState<"all" | "following">("all");

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex items-center justify-between">
          <Link href="/social" className="text-sm text-luxury-mist">
            ← Social
          </Link>
          <NotificationBell />
        </div>

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
                <p className="mt-1 text-luxury-mist">{tag ? `Posts com #${tag}` : "Discussões sobre TCG"}</p>
              </div>
              <CreatePostModal />
            </div>

            <div className="mt-4">
              <FeedSorter
                sort={sort}
                period={period}
                feed={feed}
                onSortChange={setSort}
                onPeriodChange={setPeriod}
                onFeedChange={setFeed}
              />
            </div>

            <div className="mt-6">
              <InfinitePostFeed
                sort={sort}
                period={period}
                tag={tag}
                following={feed === "following"}
              />
            </div>
          </main>

          <aside className="lg:col-span-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-luxury-mist">Populares</h2>
            <Input
              placeholder="Buscar comunidades…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 border-white/10 bg-white/5 text-base"
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
