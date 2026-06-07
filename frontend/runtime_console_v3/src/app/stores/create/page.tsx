"use client";

import { useState } from "react";
import Link from "next/link";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStore(formData);
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/stores" className="text-sm text-slate-400 hover:text-white">
          ← Voltar para lojas
        </Link>
        <h1 className="mt-4 text-3xl font-bold">Cadastrar nova loja</h1>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
            {error.message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm text-slate-300">
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
                  className="border-slate-600 bg-slate-800"
                  placeholder="Ex: Loja TCG Central"
                />
              </div>

              <div>
                <label htmlFor="slug" className="mb-1 block text-sm text-slate-300">
                  Slug (URL) *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">/stores/</span>
                  <Input
                    id="slug"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    pattern="[a-z0-9-]+"
                    className="flex-1 border-slate-600 bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-sm text-slate-300">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Localização e contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="city" className="mb-1 block text-sm text-slate-300">
                  Cidade
                </label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  className="border-slate-600 bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="country" className="mb-1 block text-sm text-slate-300">
                  País *
                </label>
                <Input
                  id="country"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
                  className="border-slate-600 bg-slate-800"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
                  E-mail *
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="border-slate-600 bg-slate-800"
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isPending} className="w-full bg-amber-500 text-slate-900">
            {isPending ? "Criando…" : "Cadastrar loja"}
          </Button>
        </form>
      </div>
    </MobileLayout>
  );
}
