import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Termos de uso — Judge TCG",
  description: "Termos de uso da loja Judge TCG",
};

export default function TermosPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <p className="mb-4 text-small font-medium uppercase tracking-wide text-primary">Legal</p>
      <h1 className="mb-6 text-h1 text-foreground">Termos de uso</h1>
      <p className="mb-6 text-body leading-relaxed text-foreground">
        Estes termos regem o uso da plataforma {brand.name} ({brand.url}), incluindo compra e venda
        de produtos de jogos de cartas, contas de usuário e serviços conectados.
      </p>

      <h2 className="mb-3 text-h3 text-foreground">1. Quem somos</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Operador: {brand.legalName}.
        {brand.cnpj ? ` CNPJ ${brand.cnpj}.` : " CNPJ ainda não publicado (obrigatório para go-live)."}{" "}
        {brand.legalAddress ? ` Endereço: ${brand.legalAddress}.` : ""} Contato:{" "}
        <a className="text-primary underline" href={`mailto:${brand.supportEmail}`}>
          {brand.supportEmail}
        </a>
        .
      </p>

      <h2 className="mb-3 text-h3 text-foreground">2. Compra e venda</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Anúncios são oferecidos por lojas parceiras. O pagamento pode ser feito via PIX ou cartão,
        conforme disponível no checkout. Quando a Compra Protegida estiver ativa, o valor pode
        permanecer retido até a confirmação de recebimento, conforme as regras exibidas no pagamento.
      </p>

      <h2 className="mb-3 text-h3 text-foreground">3. Frete e prazos</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Frete e prazo são calculados no carrinho a partir do CEP informado e das regras da loja
        vendedora. A loja é responsável pelo envio; a plataforma media disputas quando a Compra
        Protegida estiver habilitada no pedido.
      </p>

      <h2 className="mb-3 text-h3 text-foreground">4. Devoluções e disputas</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Veja as políticas de{" "}
        <Link href="/politicas/compra" className="text-primary underline">
          compra
        </Link>
        ,{" "}
        <Link href="/politicas/cancelamento" className="text-primary underline">
          cancelamento
        </Link>
        ,{" "}
        <Link href="/politicas/reembolso" className="text-primary underline">
          reembolso
        </Link>{" "}
        e{" "}
        <Link href="/politicas/marketplace" className="text-primary underline">
          regras da loja
        </Link>
        . Você pode abrir disputa pelo pedido ou contatar {brand.supportEmail}.
      </p>

      <h2 className="mb-3 text-h3 text-foreground">5. Contas</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Você é responsável pelas credenciais da conta. Podemos pedir documentos (ex.: CPF) para
        compras, vendas ou conformidade legal.
      </p>

      <h2 className="mb-3 text-h3 text-foreground">6. Privacidade</h2>
      <p className="mb-8 text-body leading-relaxed text-muted-foreground">
        O tratamento de dados pessoais está descrito na{" "}
        <Link href="/privacidade" className="text-primary underline">
          Política de privacidade
        </Link>
        .
      </p>

      <Link href="/loja" className="text-body font-medium text-primary underline">
        Voltar à loja
      </Link>
    </article>
  );
}
