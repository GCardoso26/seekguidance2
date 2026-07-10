"use client";

import Link from "next/link";
import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";

const TYPES = [
  { id: "bug", label: "Bug" },
  { id: "suggestion", label: "Sugestão" },
  { id: "praise", label: "Elogio" },
  { id: "other", label: "Outro" },
] as const;

const PRIORITIES = [
  { id: "low", label: "Baixa" },
  { id: "medium", label: "Média" },
  { id: "high", label: "Alta" },
] as const;

export default function FeedbackPage() {
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("suggestion");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]["id"]>("low");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await fetch("/api/social/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, description, priority }),
      });
      const data = (await res.json()) as { id?: string };
      if (!res.ok) throw new Error("fail");
      const shortId = data.id?.slice(0, 8).toUpperCase() ?? "—";
      showToast(`Obrigado! Seu feedback é #${shortId}`, "success");
      setSubject("");
      setDescription("");
    } catch {
      showToast("Não foi possível enviar", "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/social" className="text-sm text-muted-foreground">
          ← Social
        </Link>
        <h1 className="mt-4 text-2xl font-light text-foreground">Feedback</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ajude a melhorar o Judge TCG.</p>

        <form onSubmit={(e) => void submit(e)} className="surface-card mt-6 space-y-4 rounded-xl p-6">
          <div>
            <label className="text-sm text-muted-foreground">Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="luxury-input mt-1 w-full">
              {TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="luxury-input mt-1 w-full"
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            placeholder="Assunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border-border bg-muted/50"
            required
          />
          <textarea
            placeholder="Descreva com detalhes…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="luxury-input w-full"
            required
            minLength={10}
          />
          <Button type="submit" disabled={pending} className="w-full bg-primary text-primary-foreground">
            {pending ? "Enviando…" : "Enviar feedback"}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
