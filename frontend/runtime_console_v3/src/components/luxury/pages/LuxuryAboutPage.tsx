import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";
import { Separator } from "@/components/luxury/ui/Separator";

const TIMELINE = [
  { year: "2024", title: "Origem", text: "Nasce a visão: rulings acessíveis sem sacrificar rigor técnico." },
  { year: "2025", title: "Mesa Beta", text: "Primeiros juízes testam a IA com documentos oficiais e feedback em torneio." },
  { year: "2026", title: "Plataforma", text: "Judge TCG expande para 14 TCGs, torneios, comunidade e planos Pro." },
];

const PARTNERS = ["Wizards of the Coast", "Bandai", "Konami", "Ravensburger", "Bushiroad"];

export function LuxuryAboutPage() {
  return (
    <article className="pt-28 pb-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <RevealOnScroll>
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">Nossa história</p>
          <h1 className="mb-8 text-luxury-frost">Tornar o jogo competitivo justo e acessível</h1>
          <p className="text-lg font-light leading-relaxed text-luxury-mist">
            O Judge TCG nasceu numa mesa de torneio — onde minutos de incerteza custam rounds,
            reputações e confiança. Construímos infraestrutura para que juízes, jogadores e lojas
            operem com a mesma precisão que o jogo exige.
          </p>
        </RevealOnScroll>

        <Separator className="my-16" />

        <RevealOnScroll>
          <h2 className="mb-6 text-2xl text-luxury-frost">Missão</h2>
          <p className="text-lg font-light leading-relaxed text-luxury-mist">
            Democratizar o acesso a rulings corretos sem diluir a autoridade das fontes oficiais.
            Cada veredito deve ser rápido, verificável e digno de um head judge.
          </p>
        </RevealOnScroll>

        <div className="my-16 space-y-0">
          {TIMELINE.map((item, i) => (
            <RevealOnScroll key={item.year} delay={i * 0.1}>
              <div className="relative border-l border-luxury-gold/30 py-8 pl-8">
                <span className="absolute top-8 -left-1.5 h-3 w-3 rounded-full border border-luxury-gold bg-luxury-onyx" />
                <p className="text-xs tracking-[0.25em] text-luxury-gold uppercase">{item.year}</p>
                <h3 className="mt-2 text-xl text-luxury-frost">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-luxury-mist">{item.text}</p>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <RevealOnScroll>
          <h2 className="mb-8 text-2xl text-luxury-frost">Parceiros &amp; ecossistema</h2>
          <div className="flex flex-wrap gap-6">
            {PARTNERS.map((name) => (
              <span
                key={name}
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 text-xs tracking-[0.15em] text-luxury-mist uppercase grayscale transition-all hover:grayscale-0 hover:text-luxury-frost"
              >
                {name}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-luxury-mist/70">
            Logotipos e marcas pertencem aos seus respectivos titulares. Uso ilustrativo.
          </p>
        </RevealOnScroll>
      </div>
    </article>
  );
}
