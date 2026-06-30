"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  NOTIFICATIONS_FEED_KEY,
  NOTIFICATIONS_QUERY_KEY,
  NOTIFICATIONS_UNREAD_KEY,
  type NotificationFilter,
  type NotificationsListResponse,
} from "@/lib/notifications";
import type { AppNotification } from "@/types/post";

const REFETCH_MS = 30_000;

async function fetchNotificationsList(params?: {
  page?: number;
  limit?: number;
  filter?: NotificationFilter;
}): Promise<NotificationsListResponse> {
  const qs = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 50),
    filter: params?.filter ?? "all",
  });
  const res = await fetch(`/api/notifications?${qs}`, { cache: "no-store" });
  if (res.status === 401) return { items: [], total: 0, unread: 0, page: 1, limit: 50 };
  if (!res.ok) throw new Error("notifications_fetch_failed");
  return res.json();
}

async function fetchFeed(): Promise<AppNotification[]> {
  const res = await fetch("/api/notifications/feed", { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

async function fetchUnreadCount(): Promise<{ count: number }> {
  const res = await fetch("/api/notifications/unread-count", { cache: "no-store" });
  if (!res.ok) return { count: 0 };
  return res.json();
}

export function useNotificationsList(filter: NotificationFilter = "all", page = 1) {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: [...NOTIFICATIONS_QUERY_KEY, filter, page],
    queryFn: () => fetchNotificationsList({ filter, page }),
    enabled: Boolean(user),
    refetchInterval: REFETCH_MS,
  });
}

export function useNotificationsFeed() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: NOTIFICATIONS_FEED_KEY,
    queryFn: fetchFeed,
    enabled: Boolean(user),
    refetchInterval: REFETCH_MS,
  });
}

export function useNotificationsUnreadCount() {
  const { user } = useJudgeAuth();
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_KEY,
    queryFn: fetchUnreadCount,
    enabled: Boolean(user),
    refetchInterval: REFETCH_MS,
  });
}

/** @deprecated use useNotificationsFeed — mantido para compatibilidade */
export function useNotifications() {
  return useNotificationsFeed();
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: AppNotification) => {
      const source = n.source || "social";
      const res = await fetch(`/api/notifications/${n.id}/read?source=${source}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("mark_read_failed");
      return n;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_FEED_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (n: AppNotification) => {
      const source = n.source || "social";
      const res = await fetch(`/api/notifications/${n.id}?source=${source}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete_failed");
      return n.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_FEED_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      if (!res.ok) throw new Error("mark_all_failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_FEED_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_KEY });
      void qc.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function usePushSubscribe() {
  return useMutation({
    mutationFn: async (subscription: PushSubscriptionJSON) => {
      const res = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      return res.json();
    },
  });
}

export function usePushUnsubscribe() {
  return useMutation({
    mutationFn: async (endpoint: string) => {
      const res = await fetch("/api/notifications/push/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
      if (!res.ok) throw new Error("unsubscribe_failed");
      return res.json();
    },
  });
}
