"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PRICING_FAQS } from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="mb-10 text-center text-3xl font-bold text-white">Perguntas frequentes</h2>
      <div className="mx-auto max-w-3xl space-y-3">
        {PRICING_FAQS.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div
              key={faq.q}
              className="overflow-hidden rounded-xl border border-[#2d2d44] bg-[#1a1a2e]/70"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className="font-semibold text-foreground">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={cn("shrink-0 text-muted-foreground transition", open && "rotate-180")}
                />
              </button>
              {open && (
                <div className="border-t border-[#2d2d44]/60 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
