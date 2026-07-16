"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/auth/auth-provider";
import { requireAuth, requireRole } from "@/src/auth/guards";
import type { RoleName } from "@/src/types/auth";
import { Loading, ErrorState } from "@/src/components/ui";

export function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: RoleName;
}) {
  const { state, user } = useAuth();
  const router = useRouter();

  const result =
    role != null ? requireRole(state, user, role) : requireAuth(state, user);

  useEffect(() => {
    if (state === "loading") return;
    if (!result.ok && result.reason === "anonymous" && result.redirectTo) {
      router.replace(result.redirectTo);
    }
  }, [state, result, router]);

  if (state === "loading") {
    return <Loading label="Verificando sessão…" />;
  }

  if (!result.ok && result.reason === "anonymous") {
    return <Loading label="Redirecionando…" />;
  }

  if (!result.ok && result.reason === "missing_role") {
    return (
      <div className="space-y-3">
        <ErrorState
          title="Acesso restrito"
          description={
            role === "seller"
              ? "Crie sua loja para publicar anúncios."
              : `É necessário o papel «${role}».`
          }
        />
        {role === "seller" ? (
          <Link href="/seller/onboard" className="text-sm text-emerald-800 underline">
            Criar loja
          </Link>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
