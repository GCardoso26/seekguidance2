"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Bot,
  Globe2,
  ShoppingBag,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { RevealOnScroll } from "@/components/luxury/effects/RevealOnScroll";
import { Card } from "@/components/luxury/ui/Card";
import { MetallicGradient } from "@/components/luxury/effects/MetallicGradient";

gsap.registerPlugin(ScrollTrigger);

type DeepDive = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  body: string;
  visual: ReactNode;
};

const DEEP_DIVES: DeepDive[] = [
  {
    icon: Bot,
    title: "IA Judge",
    subtitle: "Streaming de vereditos em tempo real",
    body: "Pergunte em linguagem natural. A resposta chega token a token, com fases visíveis — embedding, retrieval, geração — e fontes oficiais anexadas ao veredito final.",
    visual: (
      <div className="space-y-2 font-mono text-xs text-luxury-mist">
        <p className="text-luxury-gold">▸ retrieving rules...</p>
        <p className="typing-line text-luxury-frost">
          O efeito constitui uma ativação na cadeia...
        </p>
        <p className="text-luxury-mist/60">3 fontes · PSCT · FAQ oficiais</p>
      </div>
    ),
  },
  {
    icon: Trophy,
    title: "Torneios",
    subtitle: "Pairing, bracket e cronômetro",
    body: "Da inscrição ao top cut — fluxo desenhado para LGS e organizadores que não podem falhar no pairing ou na comunicação de resultados.",
    visual: (
      <div className="grid grid-cols-4 gap-2">
        {["QF", "SF", "F", "W"].map((r, i) => (
          <div
            key={r}
            className="rounded-lg border border-white/10 bg-white/5 py-3 text-center text-xs text-luxury-frost"
            style={{ opacity: 0.4 + i * 0.2 }}
          >
            {r}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    subtitle: "Decklists e economia do jogo",
    body: "Decklists validadas, histórico de compras e integração com a comunidade — o ecossistema completo além da mesa de regras.",
    visual: (
      <div className="flex gap-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-24 w-20 animate-float rounded-xl border border-white/10 bg-gradient-to-b from-luxury-midnight to-luxury-velvet"
            style={{ animationDelay: `${n * 0.5}s` }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Globe2,
    title: "Comunidade",
    subtitle: "Juízes e jogadores conectados",
    body: "Amigos, comunidades por TCG, mensagens e notificações — a rede social que o competitivo merecia, sem ruído desnecessário.",
    visual: (
      <div className="relative h-32 w-full">
        {[20, 45, 70, 55, 85].map((left, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-luxury-gold shadow-lg shadow-luxury-gold/50"
            style={{ left: `${left}%`, top: `${30 + (i % 3) * 20}%` }}
          />
        ))}
      </div>
    ),
  },
];

export function LuxuryFeaturesPage() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".pin-section").forEach((section) => {
        ScrollTrigger.create({
          trigger: section,
          start: "top top",
          end: "+=80%",
          pin: true,
          pinSpacing: true,
        });
      });
    },
    { scope: container },
  );

  return (
    <div ref={container}>
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden pt-24">
        <MetallicGradient className="opacity-20" />
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-8">
          <RevealOnScroll>
            <Swords className="mx-auto mb-6 h-8 w-8 text-luxury-gold" strokeWidth={1.5} />
            <h1 className="mb-6 text-luxury-frost">Tudo o que você precisa</h1>
            <p className="text-lg font-light text-luxury-mist">
              Uma narrativa completa — da IA judge ao marketplace — construída para quem vive o
              competitivo.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {DEEP_DIVES.map((dive, i) => {
        const Icon = dive.icon;
        return (
          <section
            key={dive.title}
            className="pin-section relative flex min-h-screen items-center py-24"
          >
            <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
              <RevealOnScroll variant={i % 2 === 0 ? "slideRight" : "slideLeft"}>
                <Icon className="mb-6 h-8 w-8 text-luxury-gold" strokeWidth={1.5} />
                <p className="mb-2 text-xs tracking-[0.3em] text-luxury-gold uppercase">
                  {dive.subtitle}
                </p>
                <h2 className="mb-6 text-luxury-frost">{dive.title}</h2>
                <p className="text-lg font-light leading-relaxed text-luxury-mist">{dive.body}</p>
              </RevealOnScroll>
              <Card className="min-h-[200px] p-8">{dive.visual}</Card>
            </div>
          </section>
        );
      })}
    </div>
  );
}
