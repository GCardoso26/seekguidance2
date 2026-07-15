import type { Metadata } from "next";
import { LegalPolicyShell } from "@/components/legal/LegalPolicyShell";

export const metadata: Metadata = {
  title: "Política de cancelamento",
  description: "Cancelamento de pedidos na Judge TCG",
};

export default function PoliticaCancelamentoPage() {
  return (
    <LegalPolicyShell title="Política de cancelamento">
      <section>
        <h2 className="mb-2 text-h3 text-foreground">1. Antes do envio</h2>
        <p>
          Pedidos ainda não enviados podem ser cancelados pelo comprador ou pela loja conforme o
          status do pedido na conta. Use a área do pedido ou o suporte com o número do pedido.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">2. Depois do envio</h2>
        <p>
          Após o despacho, o cancelamento segue as regras de reembolso e disputa. Abra a disputa pelo
          pedido ou escreva para o suporte.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">3. Compra protegida</h2>
        <p>
          Se o pagamento estiver sob compra protegida, o cancelamento e a devolução do valor seguem o
          fluxo indicado na tela do pedido até a liberação ou o estorno.
        </p>
      </section>
    </LegalPolicyShell>
  );
}
