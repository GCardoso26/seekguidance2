"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EstoqueImportacaoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vendedor/painel/estoque#import");
  }, [router]);
  return null;
}
