import Link from "next/link";
import { brand } from "@/lib/brand";

export const metadata = {
  title: "Privacidade — Judge TCG",
  description: "Política de privacidade do Judge TCG",
};

export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <p className="mb-4 text-small font-medium uppercase tracking-wide text-primary">Legal</p>
      <h1 className="mb-6 text-foreground">Política de privacidade</h1>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        O {brand.name} ({brand.url}) opera loja de cartas, contas de usuário e serviços relacionados.
        Operador: {brand.legalName}
        {brand.cnpj ? ` · CNPJ ${brand.cnpj}` : ""}. Contato: {brand.supportEmail}.
      </p>
      <h2 className="mb-3 text-h3 text-foreground">Dados recolhidos</h2>
      <ul className="mb-6 list-disc space-y-2 pl-5 text-body text-muted-foreground">
        <li>Sem login: preferências locais no navegador quando aplicável.</li>
        <li>Com login: e-mail, nome e identificadores fornecidos na autenticação.</li>
        <li>Compras e vendas: dados necessários ao pedido, pagamento, frete e suporte.</li>
        <li>Documentos (ex.: CPF) quando exigidos para comprar, vender ou cumprir a lei.</li>
        <li>Métricas agregadas de uso, sem vender seus dados pessoais a terceiros para marketing.</li>
      </ul>
      <h2 className="mb-3 text-h3 text-foreground">Finalidade</h2>
      <p className="mb-6 text-body leading-relaxed text-muted-foreground">
        Operar a conta, processar pedidos, prevenir fraude, prestar suporte e melhorar o serviço.
      </p>
      <h2 className="mb-3 text-h3 text-foreground">Direitos</h2>
      <p className="mb-8 text-body leading-relaxed text-muted-foreground">
        Você pode pedir acesso, correção ou exclusão dos dados pelo e-mail {brand.supportEmail} ou
        pelos controles da conta, quando disponíveis. Veja também os{" "}
        <Link href="/termos" className="text-primary underline">
          Termos de uso
        </Link>
        .
      </p>
      <Link href="/loja" className="text-body font-medium text-primary underline">
        Voltar à loja
      </Link>
    </article>
  );
}
