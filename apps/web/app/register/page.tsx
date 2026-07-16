"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/src/auth/auth-provider";
import { Analytics } from "@/src/analytics/events";
import { registerSchema, type RegisterFormValues } from "@/src/schemas/auth";
import { ApiError } from "@/src/api/client";
import { Button, Card, Field, Form, Input, ErrorState } from "@/src/components/ui";
import { useState } from "react";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    Analytics.track("seller_signup_started", { email: values.email });
    try {
      await registerUser(values);
      Analytics.track("seller_signup_completed", { email: values.email });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "register_failed");
    }
  });

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">Criar conta</h1>
      <Form onSubmit={onSubmit}>
        <Field label="Nome" error={errors.displayName?.message}>
          <Input autoComplete="name" {...register("displayName")} />
        </Field>
        <Field label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <Input type="password" autoComplete="new-password" {...register("password")} />
        </Field>
        {error ? <ErrorState title="Não foi possível registrar" description={error} /> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando…" : "Registrar"}
        </Button>
      </Form>
    </Card>
  );
}
