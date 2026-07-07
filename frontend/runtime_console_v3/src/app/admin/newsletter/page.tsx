"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { renderSimpleMarkdown } from "@/lib/markdown";
import { showToast } from "@/lib/toast";

export default function AdminNewsletterPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [preview, setPreview] = useState(false);

  const { data: drafts = [] } = useQuery({
    queryKey: ["newsletter-archive"],
    queryFn: async () => {
      const res = await fetch("/api/social/newsletter");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const create = async () => {
    const res = await fetch("/api/social/newsletter/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      showToast("Rascunho salvo", "success");
      void qc.invalidateQueries({ queryKey: ["newsletter-archive"] });
    }
  };

  const send = async (id: string) => {
    const res = await fetch(`/api/social/newsletter/${id}/send`, { method: "POST" });
    if (res.ok) {
      showToast("Newsletter marcada como enviada (placeholder e-mail)", "success");
      void qc.invalidateQueries({ queryKey: ["newsletter-archive"] });
    }
  };

  return (
    <PageShell className="max-w-2xl">
      <PageHeader title="Newsletter" description="Rascunhos e envio de edições da newsletter." />

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-6">
        <input
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="luxury-input w-full"
        />
        <textarea
          placeholder="Conteúdo (markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="luxury-input w-full"
        />
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={() => setPreview(false)} className={preview ? "text-luxury-mist" : "text-luxury-gold"}>
            Editar
          </button>
          <button type="button" onClick={() => setPreview(true)} className={preview ? "text-luxury-gold" : "text-luxury-mist"}>
            Preview
          </button>
        </div>
        {preview && (
          <div
            className="rounded-lg border border-white/10 p-3 text-sm"
            dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(content) }}
          />
        )}
        <Button className="bg-luxury-gold text-luxury-onyx" onClick={() => void create()}>
          Salvar rascunho
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-medium">Edições</h2>
        {drafts.map((d: { id: string; title: string; sentAt?: string | null }) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-white/10 p-3">
            <span>{d.title}</span>
            {!d.sentAt && (
              <Button size="sm" variant="outline" className="border-white/10" onClick={() => void send(d.id)}>
                Enviar
              </Button>
            )}
            {d.sentAt && <span className="text-xs text-luxury-mist">Enviada</span>}
          </div>
        ))}
      </section>
    </PageShell>
  );
}
