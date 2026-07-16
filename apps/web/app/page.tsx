import Link from "next/link";
import { SearchForm } from "@/src/components/buyer/SearchForm";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          JudgeTCG
        </h1>
        <p className="max-w-lg text-zinc-600">
          Encontre a carta oficial e veja ofertas de lojas — catálogo e marketplace
          separados.
        </p>
      </div>

      <SearchForm autoFocus />

      <p className="text-sm text-zinc-500">
        Ou abra a{" "}
        <Link href="/search" className="text-emerald-800 underline">
          página de busca
        </Link>
        .
      </p>
    </div>
  );
}
