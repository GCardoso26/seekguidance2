"use client";

import type { PostComment } from "@/types/post";
import { cn } from "@/lib/utils";

type Props = {
  comments: PostComment[];
  depth?: number;
};

export function CommentTree({ comments, depth = 0 }: Props) {
  const roots = comments.filter((c) => !c.parentId);

  return (
    <ul className={cn("space-y-3", depth > 0 && "ml-4 border-l border-white/10 pl-4")}>
      {roots.map((comment) => (
        <CommentNode key={comment.id} comment={comment} all={comments} depth={depth} />
      ))}
    </ul>
  );
}

function CommentNode({
  comment,
  all,
  depth,
}: {
  comment: PostComment;
  all: PostComment[];
  depth: number;
}) {
  const replies = all.filter((c) => c.parentId === comment.id);

  return (
    <li>
      <div className="rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="text-xs text-luxury-mist">
          @{comment.authorHandle ?? "jogador"} ·{" "}
          {comment.createdAt ? new Date(comment.createdAt).toLocaleString("pt-BR") : ""}
        </p>
        <p className="mt-1 text-sm text-luxury-frost">{comment.content}</p>
      </div>
      {replies.length > 0 && (
        <ul className="mt-3 space-y-3 border-l border-white/10 pl-4">
          {replies.map((r) => (
            <CommentNode key={r.id} comment={r} all={all} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
