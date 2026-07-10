"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Flag, Share2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommunityPost } from "@/types/post";
import { showToast } from "@/lib/toast";
import { Button } from "@/components/ui/button";

type Props = {
  post: CommunityPost;
};

const REPORT_REASONS = [
  { id: "spam", label: "Spam" },
  { id: "offensive", label: "Ofensivo" },
  { id: "incorrect", label: "Incorreto" },
  { id: "other", label: "Outro" },
] as const;

export function PostActions({ post }: Props) {
  const qc = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]["id"]>("spam");

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/posts/${post.id}/save`, { method: "POST" });
      if (!res.ok) throw new Error("Falha ao salvar");
      return res.json() as Promise<{ saved: boolean }>;
    },
    onSuccess: (data) => {
      showToast(data.saved ? "Post salvo" : "Post removido dos salvos", "success");
      void qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: () => showToast("Faça login para salvar posts", "error"),
  });

  const report = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/posts/${post.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Falha ao denunciar");
      return res.json();
    },
    onSuccess: () => {
      showToast("Denúncia enviada. Obrigado!", "success");
      setReportOpen(false);
    },
  });

  const share = async () => {
    const url = `${window.location.origin}/social/communities/${post.communityId}/posts/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copiado!", "success");
    } catch {
      showToast(url, "info");
    }
  };

  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button type="button" onClick={() => void share()} className="inline-flex min-h-[44px] items-center gap-1 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary" aria-label="Compartilhar post">
          <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          Compartilhar
        </button>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <Bookmark className="h-3.5 w-3.5" strokeWidth={1.5} />
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex items-center gap-1 hover:text-rose-400"
        >
          <Flag className="h-3.5 w-3.5" strokeWidth={1.5} />
          Denunciar
        </button>
        {post.tags?.map((tag) => (
          <Link
            key={tag}
            href={`/social/communities?tag=${encodeURIComponent(tag)}`}
            className="rounded-full bg-muted/50 px-2 py-0.5 hover:text-primary"
          >
            #{tag}
          </Link>
        ))}
      </div>

      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="surface-card w-full max-w-sm rounded-xl p-5">
            <h3 className="font-medium text-foreground">Denunciar post</h3>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input type="radio" name="reason" checked={reason === r.id} onChange={() => setReason(r.id)} />
                  {r.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="flex-1 border-border" onClick={() => setReportOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-rose-600 text-foreground hover:bg-rose-500"
                disabled={report.isPending}
                onClick={() => report.mutate()}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
