"use client";

import { toast } from "sonner";

export function useJudgeToast() {
  return {
    success: (message: string) =>
      toast.success(message, {
        icon: "✨",
        duration: 3000,
        className: "animate-slide-in-right",
      }),
    error: (message: string) =>
      toast.error(message, {
        icon: "⚠️",
        duration: 5000,
        className: "animate-slide-in-right",
      }),
    loading: (message: string) =>
      toast.loading(message, {
        icon: "⏳",
        className: "animate-slide-in-right",
      }),
    cart: (itemName: string) =>
      toast.success(`${itemName} adicionado ao carrinho!`, {
        icon: "🛒",
        className: "animate-slide-in-right",
        action: {
          label: "Ver carrinho",
          onClick: () => {
            window.location.href = "/carrinho";
          },
        },
      }),
  };
}
