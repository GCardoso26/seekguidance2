"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  useCommunityPost,
  useCreateComment,
  usePostComments,
} from "@/hooks/useCommunityPosts";
import { CommentTree } from "@/components/community/CommentTree";
import { PostVote } from "@/components/community/PostVote";
import { PostActions } from "@/components/community/PostActions";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { renderSimpleMarkdown } from "@/lib/markdown";

export default function CommunityPostPage() {
  const params = useParams();
  const communityId = String(params.id);
  const postId = String(params.postId);
  const { data: post, isLoading } = useCommunityPost(postId);
  const { data: comments = [] } = usePostComments(postId);
  const createComment = useCreateComment(postId);
  const [content, setContent] = useState("");

  const images = post?.imageUrls?.length ? post.imageUrls : post?.imageUrl ? [post.imageUrl] : [];

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await createComment.mutateAsync({ content: content.trim() });
    setContent("");
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href={`/social/communities/${communityId}`} className="text-sm text-muted-foreground">
          ← Comunidade
        </Link>

        {isLoading && <p className="mt-4 text-muted-foreground">Carregando post…</p>}

        {post && (
          <article className="surface-card mt-4 flex gap-4 rounded-xl p-6">
            <PostVote post={post} />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-light text-foreground">{post.title}</h1>
              <p className="mt-1 text-xs text-muted-foreground">
                @{post.authorHandle ?? "jogador"}
                {post.createdAt && ` · ${new Date(post.createdAt).toLocaleString("pt-BR")}`}
              </p>
              {images.length > 0 && (
                <div className={`mt-4 grid gap-2 ${images.length > 1 ? "grid-cols-2" : ""}`}>
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-video overflow-hidden rounded-xl border border-border">
                      <Image src={url} alt="" fill className="object-contain" unoptimized />
                    </div>
                  ))}
                </div>
              )}
              <div
                className="prose prose-invert mt-4 max-w-none text-sm leading-relaxed text-foreground/90"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(post.content) }}
              />
              <PostActions post={post} />
            </div>
          </article>
        )}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-medium text-foreground">Comentários</h2>
          <CommentTree postId={postId} comments={comments} />
          <form onSubmit={(e) => void submitComment(e)} className="mt-6 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Escreva um comentário…"
              className="luxury-input"
            />
            <Button
              type="submit"
              disabled={createComment.isPending || !content.trim()}
              className="bg-primary text-primary-foreground"
            >
              Comentar
            </Button>
          </form>
        </section>
      </div>
    </MobileLayout>
  );
}
