"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/src/auth/auth-provider";
import { loginSchema, type LoginFormValues } from "@/src/schemas/auth";
import { ApiError } from "@/src/api/client";
import { Button, Card, Field, Form, Input, ErrorState, Loading } from "@/src/components/ui";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/session";
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      router.push(next.startsWith("/") ? next : "/session");
    } catch (err) {
      setError(err instanceof ApiError ? err.code : "login_failed");
    }
  });

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="mb-4 text-xl font-semibold text-zinc-900">Entrar</h1>
      <Form onSubmit={onSubmit}>
        <Field label="E-mail" error={errors.email?.message}>
          <Input type="email" autoComplete="email" {...register("email")} />
        </Field>
        <Field label="Senha" error={errors.password?.message}>
          <Input type="password" autoComplete="current-password" {...register("password")} />
        </Field>
        {error ? <ErrorState title="Login falhou" description={error} /> : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando…" : "Entrar"}
        </Button>
      </Form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading label="Carregando…" />}>
      <LoginForm />
    </Suspense>
  );
}
