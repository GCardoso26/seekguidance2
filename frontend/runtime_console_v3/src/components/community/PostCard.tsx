"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Pin } from "lucide-react";
import type { CommunityPost } from "@/types/post";
import { PostVote } from "@/components/community/PostVote";
import { PostActions } from "@/components/community/PostActions";
import { renderSimpleMarkdown } from "@/lib/markdown";

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
  const images = post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
  const previewHtml = renderSimpleMarkdown(
    post.content.length > 180 ? `${post.content.slice(0, 180)}…` : post.content,
  );

  return (
    <article className="luxury-card flex gap-3 rounded-xl p-4">
      <PostVote post={post} />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Pin className="h-3 w-3" strokeWidth={1.5} />
              Fixado
            </span>
          )}
          <span>@{post.authorHandle ?? "jogador"}</span>
          <span aria-hidden>·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <Link href={href} className="block">
          <h2 className="text-base font-semibold text-foreground hover:text-primary">{post.title}</h2>
        </Link>
        {images.length > 0 && (
          <div className={`mt-2 grid gap-2 ${images.length > 1 ? "grid-cols-2" : ""}`}>
            {images.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-video max-h-48 overflow-hidden rounded-lg border border-border">
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </div>
            ))}
          </div>
        )}
        {post.content && (
          <div
            className="prose prose-invert mt-2 line-clamp-2 text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
        <div className="mt-2 flex items-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            {post.commentCount} comentários
          </Link>
        </div>
        <PostActions post={post} />
      </div>
    </article>
  );
}
