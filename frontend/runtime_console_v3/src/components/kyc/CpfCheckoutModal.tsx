"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function CpfCheckoutModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-luxury-obsidian p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-luxury-frost">CPF obrigatório</h2>
        <p className="mt-2 text-sm text-luxury-mist">
          Para concluir compras no marketplace, valide seu CPF. Leva menos de um minuto.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/completar-perfil">Completar perfil</Link>
          </Button>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
}
