"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_KEY = "judge:consent";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(CONSENT_KEY) !== "1");
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de privacidade"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-luxury-obsidian/95 p-4 shadow-lg backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-luxury-frost/90">
          Utilizamos cookies e armazenamento local para histórico de consultas. Com login Google,
          nome e email são guardados no Supabase.{" "}
          <Link href="/privacidade" className="font-semibold text-luxury-gold underline hover:text-luxury-gold-light">
            Política de privacidade
          </Link>
          .
        </p>
        <button
          type="button"
          className="shrink-0 rounded-full bg-luxury-gold px-4 py-2 text-xs font-semibold text-luxury-onyx transition hover:bg-luxury-gold-light"
          onClick={() => {
            localStorage.setItem(CONSENT_KEY, "1");
            setVisible(false);
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
