import Link from "next/link";
import { ProBadge } from "@/components/store/ProBadge";

type Props = {
  plan?: string;
  expiresAt?: string | null;
};

export function ProStatusWidget({ plan = "free", expiresAt }: Props) {
  if (plan === "pro" || plan === "enterprise") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-luxury-gold/20 bg-luxury-gold/5 p-4 text-sm">
        <div className="flex items-center gap-2">
          <ProBadge plan={plan} />
          <span className="text-luxury-mist">
            Ativo{expiresAt ? ` até ${new Date(expiresAt).toLocaleDateString("pt-BR")}` : ""}
          </span>
        </div>
        <Link href="/store/pro" className="text-luxury-gold underline">
          Gerenciar
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-sm">
      <p>
        Plano <strong>Free</strong> — limite de 20 produtos. Assine Pro por R$ 49/mês para produtos ilimitados.
      </p>
      <Link href="/store/pro" className="mt-2 inline-block font-semibold text-luxury-gold underline">
        Assinar Pro Loja
      </Link>
    </div>
  );
}
