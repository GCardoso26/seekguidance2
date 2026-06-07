"use client";

import { useQuery } from "@tanstack/react-query";

export type FriendProfile = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url?: string;
  status?: string;
  unread?: number;
  friendship_id?: string;
};

export function useFriends() {
  const friendsQuery = useQuery({
    queryKey: ["friends"],
    queryFn: async (): Promise<FriendProfile[]> => {
      const res = await fetch("/api/social/friends", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const pendingQuery = useQuery({
    queryKey: ["friends-pending"],
    queryFn: async (): Promise<FriendProfile[]> => {
      const res = await fetch("/api/social/friends/pending", { cache: "no-store" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return {
    friends: friendsQuery.data ?? [],
    pendingRequests: pendingQuery.data ?? [],
    isLoading: friendsQuery.isLoading || pendingQuery.isLoading,
  };
}
