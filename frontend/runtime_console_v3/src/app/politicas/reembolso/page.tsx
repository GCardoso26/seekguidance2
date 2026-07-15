import type { Metadata } from "next";
import { LegalPolicyShell } from "@/components/legal/LegalPolicyShell";

export const metadata: Metadata = {
  title: "Política de reembolso",
  description: "Reembolsos e estornos na Judge TCG",
};

export default function PoliticaReembolsoPage() {
  return (
    <LegalPolicyShell title="Política de reembolso">
      <section>
        <h2 className="mb-2 text-h3 text-foreground">1. Quando cabe reembolso</h2>
        <p>
          Exemplos: produto não enviado no prazo comprometido, item substancialmente diferente do
          anúncio, ou acordo formalizado na disputa do pedido. Cada caso é analisado com as
          evidências do comprador e da loja.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">2. Como solicitar</h2>
        <p>
          Abra a disputa ou o pedido na conta do comprador, ou envie e-mail ao suporte com número do
          pedido, fotos e descrição do problema.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">3. Prazo e forma</h2>
        <p>
          Estornos seguem o meio de pagamento original (PIX/cartão) e os prazos do provedor
          financeiro. Taxas de frete e da compra protegida podem ou não ser reembolsáveis conforme o
          motivo e o que foi pago.
        </p>
      </section>
    </LegalPolicyShell>
  );
}
