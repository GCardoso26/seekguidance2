import { TESTIMONIALS } from "@/constants/luxury/tcgThemes";
import { Card } from "@/components/luxury/ui/Card";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";

export function TestimonialsSection() {
  return (
    <section className="relative py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <RevealOnScroll className="mb-16 text-center">
          <p className="mb-4 text-xs tracking-[0.3em] text-luxury-gold uppercase">Confiança</p>
          <h2 className="text-luxury-frost">Quem já sente a diferença na mesa</h2>
        </RevealOnScroll>

        <div className="grid gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <RevealOnScroll key={t.name} delay={i * 0.12}>
              <Card className="relative h-full pt-10">
                <span
                  className="text-luxury absolute top-4 left-6 text-5xl leading-none font-serif opacity-40"
                  aria-hidden
                >
                  &ldquo;
                </span>
                <blockquote className="text-sm leading-relaxed font-light text-luxury-frost italic">
                  {t.quote}
                </blockquote>
                <footer className="mt-8 flex items-center gap-3 border-t border-white/5 pt-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-luxury-gold/30 bg-luxury-gold/10 text-xs font-medium text-luxury-gold">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-luxury-frost">{t.name}</p>
                    <p className="text-xs text-luxury-mist">{t.title}</p>
                  </div>
                </footer>
              </Card>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
