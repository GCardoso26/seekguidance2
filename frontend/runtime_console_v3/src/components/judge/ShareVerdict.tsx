"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";
import { Check, MessageCircle, Share2 } from "lucide-react";
import { createJudgeShare, buildSignedShareUrl } from "@/services/judgeShareApi";
import { buildJudgeShareUrl } from "@/lib/judge-url";
import { showToast } from "@/lib/toast";
import type { JudgeResponse, TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  tcg: TcgType;
  question: string;
  response: JudgeResponse;
  className?: string;
};

export function ShareVerdict({ tcg, question, response, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function buildUrl(): Promise<string> {
    const share = await createJudgeShare(tcg, question, response);
    return share
      ? buildSignedShareUrl(share.id, share.signature)
      : buildJudgeShareUrl(tcg, question);
  }

  async function copyLink() {
    const url = await buildUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast("Link copiado!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  async function openShare(intent: "whatsapp" | "twitter") {
    const url = await buildUrl();
    const text = encodeURIComponent(`Veredito Judge TCG: ${question.slice(0, 120)}`);
    const encoded = encodeURIComponent(url);
    const href =
      intent === "whatsapp"
        ? `https://wa.me/?text=${text}%20${encoded}`
        : `https://twitter.com/intent/tweet?text=${text}&url=${encoded}`;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-foreground hover:bg-muted/80",
            className,
          )}
          aria-label="Partilhar veredito"
        >
          {copied ? <Check className="h-3 w-3 text-primary-light" /> : <Share2 className="h-3 w-3" />}
          Partilhar
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="start"
          className="z-50 min-w-[160px] rounded-xl border border-border bg-card p-1 shadow-xl"
        >
          <DropdownMenu.Item
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground/90 outline-none hover:bg-muted/80"
            onSelect={() => void copyLink()}
          >
            Copiar link
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground/90 outline-none hover:bg-muted/80"
            onSelect={() => void openShare("whatsapp")}
          >
            WhatsApp
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground/90 outline-none hover:bg-muted/80"
            onSelect={() => void openShare("twitter")}
          >
            Twitter / X
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-foreground/90 outline-none hover:bg-muted/80"
            onSelect={() => {
              void copyLink().then(() => showToast("Cole o link no Discord", "info"));
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Discord (copiar)
            </span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
