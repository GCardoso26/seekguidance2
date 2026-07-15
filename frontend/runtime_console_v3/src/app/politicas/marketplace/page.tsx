import type { Metadata } from "next";
import { LegalPolicyShell } from "@/components/legal/LegalPolicyShell";

export const metadata: Metadata = {
  title: "Regras da loja",
  description: "Responsabilidades da plataforma e das lojas vendedoras",
};

export default function PoliticaMarketplacePage() {
  return (
    <LegalPolicyShell title="Regras da loja (marketplace)">
      <section>
        <h2 className="mb-2 text-h3 text-foreground">1. Papel da plataforma</h2>
        <p>
          A Judge TCG disponibiliza o site, contas, catálogo, carrinho e checkout. Não fabricamos as
          cartas anunciadas pelas lojas parceiras.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">2. Papel da loja vendedora</h2>
        <p>
          A loja é responsável pelo anúncio verdadeiro, estoque, preço, embalagem, envio e atendimento
          pós-venda do pedido, salvo quando a mediação da compra protegida se aplicar.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">3. Conduta</h2>
        <p>
          É proibido anúncio enganoso, falsificação, abuso de avaliações e uso da plataforma para
          fraude. Contas e anúncios podem ser suspensos.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-h3 text-foreground">4. Dados pessoais</h2>
        <p>
          O tratamento de dados segue a Política de Privacidade (LGPD) e os Termos de uso.
        </p>
      </section>
    </LegalPolicyShell>
  );
}
