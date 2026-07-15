import type { Metadata } from "next";
import { LegalPolicyShell } from "@/components/legal/LegalPolicyShell";

export const metadata: Metadata = {
  title: "Política de compra",
  description: "Como funcionam as compras na loja Judge TCG",
};

export default function PoliticaCompraPage() {
  return (
    <LegalPolicyShell title="Política de compra">
      <section>
        <h2 className="mb-2 text-h3 text-foreground">1. O que você compra</h2>
        <p>
          Anúncios são publicados por lojas parceiras. O preço, a condição da carta, o estoque e o
          prazo de envio são informações da loja vendedora, exibidas no anúncio e no carrinho.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">2. Pagamento</h2>
        <p>
          O pagamento é feito no checkout com os meios disponíveis (por exemplo PIX ou cartão). Ao
          concluir, você recebe a confirmação do pedido na conta, quando aplicável.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">3. Compra protegida</h2>
        <p>
          Se a opção Compra protegida estiver disponível e ativada, o valor pode ficar retido até você
          confirmar o recebimento, conforme as regras mostradas no pagamento. Há taxa indicada no
          resumo do pedido.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">4. Frete</h2>
        <p>
          Frete e prazo são calculados no carrinho a partir do CEP e das regras da loja. Confira esses
          valores antes de pagar.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">5. Responsabilidades</h2>
        <p>
          A loja vendedora é responsável pelo anúncio, estoque, embalagem e envio. A plataforma opera o
          site, a conta e, quando contratado, a mediação da compra protegida. Detalhes em Regras da
          loja e Termos de uso.
        </p>
      </section>
    </LegalPolicyShell>
  );
}
