"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CommunityPost, PostComment, PostSort, TopPeriod } from "@/types/post";

export function useCommunityPosts(opts?: {
  communityId?: string;
  authorId?: string;
  tag?: string;
  following?: boolean;
  sort?: PostSort;
  period?: TopPeriod;
  cursor?: string;
}) {
  const sort = opts?.sort ?? "hot";
  const period = opts?.period ?? "all";
  const params = new URLSearchParams({ sort });
  if (opts?.communityId) params.set("community_id", opts.communityId);
  if (opts?.authorId) params.set("author_id", opts.authorId);
  if (opts?.tag) params.set("tag", opts.tag);
  if (opts?.following) params.set("following", "true");
  if (sort === "top" && period !== "all") params.set("period", period);
  if (opts?.cursor) params.set("cursor", opts.cursor);

  return useQuery({
    queryKey: ["community-posts", opts?.communityId, opts?.authorId, opts?.tag, opts?.following, sort, period, opts?.cursor],
    queryFn: async (): Promise<CommunityPost[]> => {
      const res = await fetch(`/api/social/posts?${params}`, { cache: "no-store" });
      if (!res.ok) return [];
      const json = (await res.json()) as CommunityPost[] | { items?: CommunityPost[] };
      return Array.isArray(json) ? json : (json.items ?? []);
    },
    enabled: opts?.authorId ? Boolean(opts.authorId) : true,
  });
}

export function useCommunityPost(postId: string) {
  return useQuery({
    queryKey: ["community-post", postId],
    queryFn: async (): Promise<CommunityPost> => {
      const res = await fetch(`/api/social/posts/${postId}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Post não encontrado");
      return res.json();
    },
    enabled: Boolean(postId),
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async (): Promise<PostComment[]> => {
      const res = await fetch(`/api/social/posts/${postId}/comments`, { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(postId),
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      community_id: string;
      title: string;
      content: string;
      image_url?: string;
      image_urls?: string[];
      tags?: string[];
    }) => {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao criar post");
      return res.json() as Promise<CommunityPost>;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["community-posts"] }),
  });
}

export function useVotePost(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: 1 | -1) => {
      const res = await fetch(`/api/social/posts/${postId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Falha ao votar");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["community-post", postId] });
      void qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}

export function useCreateComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { content: string; parent_id?: string }) => {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao comentar");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["post-comments", postId] });
      void qc.invalidateQueries({ queryKey: ["community-post", postId] });
      void qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}
