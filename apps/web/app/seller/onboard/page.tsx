"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Protected } from "@/src/components/Protected";
import { useAuth } from "@/src/auth/auth-provider";
import { canAccessSeller } from "@/src/auth/guards";
import { OnboardForm } from "@/src/components/seller/OnboardForm";
import { Loading } from "@/src/components/ui";

function OnboardBody() {
  const { user, state } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (state === "authenticated" && canAccessSeller(user)) {
      router.replace("/seller/listings/new");
    }
  }, [state, user, router]);

  if (canAccessSeller(user)) {
    return <Loading label="Loja já criada — redirecionando…" />;
  }

  return <OnboardForm />;
}

export default function SellerOnboardPage() {
  return (
    <Protected>
      <OnboardBody />
    </Protected>
  );
}
