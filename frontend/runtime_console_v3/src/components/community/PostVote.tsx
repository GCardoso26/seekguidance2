"use client";

import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useVotePost } from "@/hooks/useCommunityPosts";
import type { CommunityPost } from "@/types/post";
import { cn } from "@/lib/utils";

type Props = {
  post: CommunityPost;
  compact?: boolean;
};

export function PostVote({ post }: Props) {
  const vote = useVotePost(post.id);

  return (
    <div className="flex flex-col items-center gap-0.5 text-luxury-mist">
      <motion.button
        type="button"
        whileTap={{ scale: 1.15 }}
        disabled={vote.isPending}
        onClick={() => void vote.mutateAsync(1)}
        className="rounded p-1 hover:bg-luxury-gold/10 hover:text-luxury-gold-light"
        aria-label="Upvote"
      >
        <ChevronUp className="h-5 w-5" strokeWidth={1.5} />
      </motion.button>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          post.voteCount > 0 && "text-luxury-gold-light",
          post.voteCount < 0 && "text-rose-400",
        )}
      >
        {post.voteCount}
      </span>
      <motion.button
        type="button"
        whileTap={{ scale: 1.15 }}
        disabled={vote.isPending}
        onClick={() => void vote.mutateAsync(-1)}
        className="rounded p-1 hover:bg-rose-500/10 hover:text-rose-400"
        aria-label="Downvote"
      >
        <ChevronDown className="h-5 w-5" strokeWidth={1.5} />
      </motion.button>
    </div>
  );
}
