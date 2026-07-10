"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSellerSettings, useUpdateSellerSettings } from "@/hooks/useSellerSettings";
import {
  sellerStoreSettingsSchema,
  storeSettingsToApiPayload,
  type SellerStoreSettingsFormValues,
} from "@/lib/seller-settings-forms";
import { PageSkeleton } from "../PageShell";

const StoreReviewsManager = dynamic(
  () => import("@/components/store/StoreReviewsManager").then((m) => m.StoreReviewsManager),
  { ssr: false, loading: () => <PageSkeleton rows={3} /> },
);

type Props = {
  storeId: string;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}

export function StoreSettingsForm({ storeId }: Props) {
  const { data, isLoading } = useSellerSettings(storeId);
  const update = useUpdateSellerSettings(storeId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SellerStoreSettingsFormValues>({
    resolver: zodResolver(sellerStoreSettingsSchema),
    defaultValues: { name: "", description: "", slug: "" },
  });

  useEffect(() => {
    if (!data) return;
    reset({
      name: data.store.name,
      description: data.store.description,
      slug: data.store.slug,
    });
  }, [data, reset]);

  async function onSubmit(values: SellerStoreSettingsFormValues) {
    try {
      await update.mutateAsync({
        section: "store",
        data: storeSettingsToApiPayload(values),
      });
      toast.success("Dados da loja atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    }
  }

  if (isLoading) return <PageSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="space-y-4 surface-card p-6"
        data-testid="store-settings-form"
      >
        <h3 className="font-semibold text-white">Dados da loja</h3>

        <div>
          <label htmlFor="store-name" className="text-sm text-muted-foreground">
            Nome
          </label>
          <Input id="store-name" className="mt-1 border-border bg-black/30" {...register("name")} />
          <FieldError message={errors.name?.message} />
        </div>

        <div>
          <label htmlFor="store-slug" className="text-sm text-muted-foreground">
            Slug (URL pública)
          </label>
          <Input id="store-slug" className="mt-1 border-border bg-black/30 font-mono" {...register("slug")} />
          <FieldError message={errors.slug?.message} />
          <p className="mt-1 text-xs text-muted-foreground/70">Validação de unicidade no backend ao salvar.</p>
        </div>

        <div>
          <label htmlFor="store-desc" className="text-sm text-muted-foreground">
            Descrição
          </label>
          <textarea
            id="store-desc"
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-black/30 px-3 py-2 text-sm"
            {...register("description")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        <Button type="submit" disabled={isSubmitting || update.isPending}>
          {isSubmitting || update.isPending ? "Salvando…" : "Salvar loja"}
        </Button>

        {data?.store.slug && (
          <p className="text-sm text-muted-foreground">
            <Link
              href={`/seller/${data.store.slug}`}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver minha loja pública → /seller/{data.store.slug}
            </Link>
          </p>
        )}
      </form>

      <section className="surface-card p-6">
        <h3 className="mb-3 font-semibold">Avaliações</h3>
        <StoreReviewsManager storeId={storeId} />
      </section>
    </div>
  );
}
