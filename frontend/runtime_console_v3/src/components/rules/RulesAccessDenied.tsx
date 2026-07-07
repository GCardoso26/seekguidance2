"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import type { RulesAccessReason } from "@/lib/rules-access";

type Props = {
  reason: RulesAccessReason;
  title?: string;
};

export function RulesAccessDenied({ reason, title = "Acesso às regras" }: Props) {
  const isLogin = reason === "login_required";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <Scale className="mb-4 h-10 w-10 text-luxury-gold" aria-hidden />
      <h1 className="text-2xl font-bold text-luxury-frost">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-luxury-mist">
        {isLogin
          ? "Entre na sua conta para consultar regras oficiais e rulings com fontes verificadas."
          : "Este conteúdo é exclusivo para juízes certificados, assinantes PRO/LGS ou lojas parceiras."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        {isLogin ? (
          <Link
            href="/entrar?next=/regras"
            className="rounded-full bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-onyx"
          >
            Entrar
          </Link>
        ) : (
          <>
            <Link
              href="/pricing"
              className="rounded-full bg-luxury-gold px-6 py-3 text-sm font-semibold text-luxury-onyx"
            >
              Assinar plano PRO
            </Link>
            <Link
              href="/vendedor/painel/planos"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-luxury-frost hover:bg-white/5"
            >
              Plano LGS para lojas
            </Link>
            <Link
              href="/judge/dashboard"
              className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-luxury-frost hover:bg-white/5"
            >
              Solicitar certificação de juiz
            </Link>
          </>
        )}
        <Link href="/loja" className="text-sm text-luxury-mist underline hover:text-luxury-gold">
          Voltar à loja
        </Link>
      </div>
    </div>
  );
}
