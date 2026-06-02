"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { IngestionProgress } from "@/components/admin/IngestionProgress";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { useUserRole } from "@/hooks/useUserRole";
import { reindexGame, uploadIngestionPdf } from "@/services/infrastructureApi";

export default function AdminIngestionUploadPage() {
  const { canIngest, loading } = useUserRole();
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadIngestionPdf("swu", file);
      setMessage(res.note ?? "PDF recebido. Processamento iniciado para SWU.");
      await reindexGame("swu").catch(() => undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted-foreground">A verificar permissões…</p>
      </AppShell>
    );
  }

  if (!canIngest) {
    return (
      <AppShell>
        <p className="text-destructive">Permissão de ingestão necessária.</p>
        <Link href="/judge" className="mt-4 inline-block text-sm underline">
          Voltar
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ingestão — Star Wars Unlimited</h1>
          <p className="text-sm text-muted-foreground">
            PDF → parsing → chunks → embeddings → indexação
          </p>
        </div>
        <Link href="/admin/console" className="text-sm text-primary hover:underline">
          ← Console
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Upload de regras (PDF)</h2>
          <UploadDropzone onUpload={handleUpload} disabled={uploading} />
          {message && (
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </section>
        <section className="rounded-xl border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Progresso</h2>
          <IngestionProgress gameSlug="swu" />
        </section>
      </div>
    </AppShell>
  );
}
