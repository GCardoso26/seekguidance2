"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Scale, Zap } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function LandingDemo() {
  const { user } = useJudgeAuth();

  return (
    <section id="veja-como-funciona" className="container mx-auto scroll-mt-24 px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="mb-3 text-3xl font-bold text-white">Veja como funciona</h2>
        <p className="mx-auto max-w-xl text-slate-400">
          Pergunte em português, receba veredito com fonte oficial — como na mesa de torneio.
        </p>
      </div>

      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-2xl">
        <div className="border-b border-slate-700/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            <span className="ml-2 text-xs text-slate-500">judgetcg.com.br/judge</span>
          </div>
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="ml-auto max-w-[85%] rounded-2xl rounded-br-md border border-slate-700 bg-slate-800/80 px-4 py-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pergunta</p>
            <p className="mt-1 text-sm text-slate-200">
              Land cai no campo virada ou desvirada?
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="judge-card rounded-2xl border border-slate-700/50 bg-slate-900/90 p-4"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                <Check className="h-5 w-5 text-emerald-400" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Veredito</p>
                <p className="text-lg font-bold text-white">Permitido</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">
                <Zap className="h-3 w-3" />
                Instantâneo
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">
              Terras entram no campo de batalha viradas, a menos que a carta diga o contrário ou um efeito
              as coloque desviradas.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              <Scale className="h-3.5 w-3.5" />
              CR 305.6 — Comprehensive Rules
            </div>
          </motion.div>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pb-6 pt-16">
          <Link
            href={user ? "/judge?tcg=magic" : "/#login-section"}
            className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-amber-400"
          >
            Experimentar agora
          </Link>
        </div>
      </div>
    </section>
  );
}
