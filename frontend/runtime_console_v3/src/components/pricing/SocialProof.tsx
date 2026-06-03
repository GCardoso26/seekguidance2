"use client";

const TESTIMONIALS = [
  {
    quote: "Salvou meu FNM quando ninguém sabia a regra de stack.",
    author: "Carlos M.",
    role: "Spike MTG",
  },
  {
    quote: "Uso na loja para treinar judges novatos.",
    author: "Ana L.",
    role: "LGS São Paulo",
  },
  {
    quote: "Veredito com fonte oficial — isso muda o jogo.",
    author: "Pedro R.",
    role: "Competidor YGO",
  },
];

const LGS_PLACEHOLDERS = ["CardVault", "Mesa Redonda", "Spellbound", "TCG Arena"];

export function SocialProof() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-5xl rounded-2xl border border-[#2d2d44] bg-[#1a1a2e]/50 p-8 text-center">
        <p className="font-mono text-3xl font-bold text-amber-400 md:text-4xl">2.400+</p>
        <p className="mb-8 text-slate-400">consultas de regras esta semana</p>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="rounded-xl border border-[#2d2d44]/80 bg-[#0a0a0f]/60 p-4 text-left"
            >
              <p className="mb-3 text-sm italic text-slate-300">&ldquo;{t.quote}&rdquo;</p>
              <footer className="text-xs text-slate-500">
                <span className="font-semibold text-slate-400">{t.author}</span> · {t.role}
              </footer>
            </blockquote>
          ))}
        </div>

        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">
          LGS parceiras (em breve)
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {LGS_PLACEHOLDERS.map((name) => (
            <span
              key={name}
              className="rounded-lg border border-dashed border-slate-600 px-4 py-2 text-sm text-slate-500"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
