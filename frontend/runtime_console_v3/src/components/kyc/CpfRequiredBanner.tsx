"use client";

import Link from "next/link";
import { useAccountStatus, needsCpfCompletion } from "@/hooks/useAccountStatus";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function CpfRequiredBanner() {
  const { user } = useJudgeAuth();
  const { data } = useAccountStatus();

  if (!user || !needsCpfCompletion(data)) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-950/40 px-4 py-2 text-center text-sm text-amber-100">
      ⚠️ Insira seu CPF para ativar sua conta e realizar compras.{" "}
      <Link href="/completar-perfil" className="font-medium text-warning underline">
        Completar perfil
      </Link>
    </div>
  );
}
