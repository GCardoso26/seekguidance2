"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TCG_OPTIONS } from "@/types/judge";
import type { NewsletterEdition } from "@/types/post";
import { renderSimpleMarkdown } from "@/lib/markdown";
import { showToast } from "@/lib/toast";

export default function NewsletterArchivePage() {
  const [email, setEmail] = useState("");
  const [tcgs, setTcgs] = useState<string[]>([]);
  const { data: editions = [] } = useQuery({
    queryKey: ["newsletter-archive"],
    queryFn: async () => {
      const res = await fetch("/api/social/newsletter");
      if (!res.ok) return [];
      return res.json() as Promise<NewsletterEdition[]>;
    },
  });

  const subscribe = async () => {
    const res = await fetch("/api/social/newsletter/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, tcg_ids: tcgs }),
    });
    if (res.ok) showToast("Inscrição confirmada!", "success");
    else showToast("Não foi possível inscrever", "error");
  };

  const toggleTcg = (id: string) => {
    setTcgs((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/social" className="text-sm text-muted-foreground">
          ← Social
        </Link>
        <h1 className="mt-4 text-2xl font-light text-foreground">Newsletter Judge TCG</h1>
        <p className="mt-2 text-sm text-muted-foreground">Receba novidades dos TCGs que você joga.</p>

        <section className="luxury-card mt-8 rounded-xl p-6">
          <h2 className="font-medium">Inscrever-se</h2>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-3 border-border bg-muted/50"
          />
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {TCG_OPTIONS.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={tcgs.includes(t.id)} onChange={() => toggleTcg(t.id)} />
                {t.label}
              </label>
            ))}
          </div>
          <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => void subscribe()}>
            Inscrever
          </Button>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-lg font-medium">Arquivo</h2>
          {editions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma edição publicada ainda.</p>}
          {editions.map((ed) => (
            <article key={ed.id} className="luxury-card rounded-xl p-5">
              <h3 className="text-lg font-medium text-foreground">{ed.title}</h3>
              {ed.sentAt && (
                <p className="mt-1 text-xs text-muted-foreground">{new Date(ed.sentAt).toLocaleDateString("pt-BR")}</p>
              )}
              <div
                className="prose prose-invert mt-3 text-sm"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(ed.content.slice(0, 800)) }}
              />
            </article>
          ))}
        </section>
      </div>
    </MobileLayout>
  );
}
