"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Scale } from "lucide-react";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { normalizeInternalPath } from "@/lib/auth/safe-path";

function EntrarForm() {
  const searchParams = useSearchParams();
  const nextPath = normalizeInternalPath(searchParams.get("next") ?? "/perfil", "/perfil");

  return (
    <div className="flex min-h-screen items-center justify-center bg-luxury-onyx p-4 text-luxury-frost">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-luxury-obsidian p-8 shadow-xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-luxury-gold/30 bg-luxury-gold/10">
            <Scale className="h-5 w-5 text-luxury-gold" strokeWidth={1.5} />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-luxury-mist">Judge TCG</p>
            <h1 className="text-lg font-medium text-luxury-frost">Entrar na plataforma</h1>
          </div>
        </div>

        <p className="mb-6 text-sm text-luxury-mist">
          Use sua conta Google para acessar perfil, coleção, pedidos e marketplace.
        </p>

        <GoogleLoginButton redirectTo={nextPath} />

        <p className="mt-6 text-center text-xs text-luxury-mist">
          <Link href="/" className="text-luxury-gold hover:underline">
            Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-onyx" />}>
      <EntrarForm />
    </Suspense>
  );
}
