"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getApiClients } from "@/src/api";
import { ApiError } from "@/src/api/client";
import { useAuth } from "@/src/auth/auth-provider";
import { markShopCreated } from "@/src/auth/seller-funnel";
import { Analytics } from "@/src/analytics/events";
import { onboardSchema, type OnboardFormValues } from "@/src/schemas/seller";
import { Button, Card, ErrorState, Field, Form, Input } from "@/src/components/ui";

export function OnboardForm() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardFormValues>({
    resolver: zodResolver(onboardSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    const { marketplaceApi } = getApiClients();
    try {
      const shop = await marketplaceApi.onboardSeller(values);
      markShopCreated(shop.sellerId);
      Analytics.track("seller_shop_created", {
        sellerId: shop.sellerId,
        slug: shop.slug,
      });
      // JWT must pick up seller role before publish routes
      await refresh();
      router.push("/seller/listings/new");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "onboard_failed");
    }
  });

  return (
    <Card className="mx-auto max-w-md space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900">Criar loja</h1>
      <p className="text-sm text-zinc-600">
        Só o nome da loja. Sem CNPJ, endereço ou dashboard nesta etapa.
      </p>
      <Form onSubmit={onSubmit}>
        <Field label="Nome da loja" error={errors.displayName?.message}>
          <Input autoFocus autoComplete="organization" {...register("displayName")} />
        </Field>
        {error ? <ErrorState title="Não foi possível criar a loja" description={error} /> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando…" : "Criar loja"}
        </Button>
      </Form>
    </Card>
  );
}
