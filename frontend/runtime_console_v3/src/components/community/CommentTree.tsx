"use client";

import { useState } from "react";
import { Reply } from "lucide-react";
import type { PostComment } from "@/types/post";
import { useCreateComment } from "@/hooks/useCommunityPosts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  postId: string;
  comments: PostComment[];
  depth?: number;
};

export function CommentTree({ postId, comments, depth = 0 }: Props) {
  const roots = comments.filter((c) => !c.parentId);

  return (
    <ul className={cn("space-y-3", depth > 0 && "ml-4 border-l border-white/10 pl-4")}>
      {roots.map((comment) => (
        <CommentNode key={comment.id} postId={postId} comment={comment} all={comments} depth={depth} />
      ))}
    </ul>
  );
}

function CommentNode({
  postId,
  comment,
  all,
  depth,
}: {
  postId: string;
  comment: PostComment;
  all: PostComment[];
  depth: number;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const createComment = useCreateComment(postId);
  const replies = all.filter((c) => c.parentId === comment.id);

  const submitReply = async () => {
    if (!replyText.trim()) return;
    await createComment.mutateAsync({ content: replyText.trim(), parent_id: comment.id });
    setReplyText("");
    setReplyOpen(false);
  };

  return (
    <li>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-luxury-mist">
          @{comment.authorHandle ?? "jogador"} ·{" "}
          {comment.createdAt ? new Date(comment.createdAt).toLocaleString("pt-BR") : ""}
        </p>
        <p className="mt-1 text-sm text-luxury-frost">{comment.content}</p>
        <button
          type="button"
          onClick={() => setReplyOpen((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs text-luxury-mist hover:text-luxury-gold"
        >
          <Reply className="h-3 w-3" strokeWidth={1.5} />
          Responder
        </button>
      </div>
      {replyOpen && (
        <div className="mt-2 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            className="luxury-input w-full text-sm"
            placeholder="Sua resposta…"
          />
          <Button size="sm" className="bg-luxury-gold text-luxury-onyx" onClick={() => void submitReply()}>
            Enviar resposta
          </Button>
        </div>
      )}
      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-white/10 pl-4">
          {replies.map((r) => (
            <CommentNode key={r.id} postId={postId} comment={r} all={all} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
