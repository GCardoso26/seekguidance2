"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCreateStore } from "@/hooks/useCreateStore";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function CreateStorePage() {
  const { mutate: createStore, isPending, error } = useCreateStore();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    city: "",
    country: "BR",
    email: "",
  });

  const { data: myStores } = useQuery({
    queryKey: ["my-stores"],
    queryFn: async () => {
      const res = await fetch("/api/stores/mine");
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ id: string; name: string; slug: string }>>;
    },
  });

  const existingStore = myStores?.[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStore(formData);
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/stores" className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar para lojas
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Cadastrar nova loja</h1>

        {existingStore && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm">
            <p>
              Você já tem a loja <strong>{existingStore.name}</strong> ({existingStore.slug}).
            </p>
            <Link href="/vendedor/painel/configuracoes/pagamentos" className="mt-2 inline-block text-primary underline">
              Ir para o dashboard e conectar Stripe
            </Link>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-sm text-danger">
            {error.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm text-foreground/90">
                  Nome da loja *
                </label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({ ...prev, name, slug: generateSlug(name) }));
                  }}
                  className="border-border bg-muted/50"
                  placeholder="Ex: Loja TCG Central"
                />
              </div>

              <div>
                <label htmlFor="slug" className="mb-1 block text-sm text-foreground/90">
                  Slug (URL) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground/70">/stores/</span>
                  <Input
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      }))
                    }
                    minLength={3}
                    maxLength={50}
                    className="flex-1 border-border bg-muted/50"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Letras minúsculas, números e hífens (3–50 caracteres).</p>
              </div>
              <div>
                <label htmlFor="description" className="mb-1 block text-sm text-foreground/90">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-border bg-card shadow-card px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/50">
            <CardHeader>
              <CardTitle>Localização e contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="city" className="mb-1 block text-sm text-foreground/90">
                  Cidade
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="border-border bg-muted/50"
                />
              </div>
              <div>
                <label htmlFor="country" className="mb-1 block text-sm text-foreground/90">
                  País *
                </label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  className="border-border bg-muted/50"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-foreground/90">
                  E-mail *
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="border-border bg-muted/50"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground">
            {isPending ? "Criando…" : "Cadastrar loja"}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
