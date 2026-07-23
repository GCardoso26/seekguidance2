"use client";

import { useCallback } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";

type Props = {
  kind: "collection" | "wishlist" | "progress" | "achievements";
  username?: string;
  className?: string;
};

/**
 * Compartilhar coleção / wishlist / progresso / conquistas (perfil público).
 */
export function SharePlayerArtifactButton({ kind, username, className }: Props) {
  const share = useCallback(async () => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    const path =
      kind === "collection"
        ? username
          ? `/u/${username}/collection`
          : "/colecao"
        : kind === "wishlist"
          ? username
            ? `/u/${username}/wishlist`
            : "/wishlist"
          : kind === "achievements"
            ? "/perfil/conquistas"
            : "/colecao";
    const url = `${base}${path}`;
    const title =
      kind === "wishlist"
        ? "Minha wishlist"
        : kind === "achievements"
          ? "Minhas conquistas"
          : kind === "progress"
            ? "Meu progresso de coleção"
            : "Minha coleção";
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Link copiado", "success");
      }
    } catch {
      showToast("Não foi possível compartilhar", "error");
    }
  }, [kind, username]);

  return (
    <Button type="button" size="sm" variant="outline" className={className} onClick={share}>
      <Share2 className="mr-1.5 h-4 w-4" />
      Compartilhar
    </Button>
  );
}
