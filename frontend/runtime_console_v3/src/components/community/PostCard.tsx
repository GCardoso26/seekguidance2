"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import type { CommunityPost } from "@/types/post";
import { PostVote } from "@/components/community/PostVote";

function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

type Props = {
  post: CommunityPost;
};

export function PostCard({ post }: Props) {
  const href = `/social/communities/${post.communityId}/posts/${post.id}`;
  const preview = post.content.length > 180 ? `${post.content.slice(0, 180)}…` : post.content;

  return (
    <article className="luxury-card flex gap-3 rounded-xl p-4">
      <PostVote post={post} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-luxury-mist">
          <span>@{post.authorHandle ?? "jogador"}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <Link href={href} className="block">
          <h2 className="text-base font-semibold text-luxury-frost hover:text-luxury-gold">{post.title}</h2>
        </Link>
        {post.imageUrl && (
          <div className="relative mt-2 aspect-video max-h-48 overflow-hidden rounded-lg border border-white/10">
            <Image src={post.imageUrl} alt="" fill className="object-cover" unoptimized />
          </div>
        )}
        {post.content && <p className="mt-2 line-clamp-2 text-sm text-luxury-mist">{preview}</p>}
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-luxury-mist hover:text-luxury-gold"
        >
          <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
          {post.commentCount} comentários
        </Link>
      </div>
    </article>
  );
}
