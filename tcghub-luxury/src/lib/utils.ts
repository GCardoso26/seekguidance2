import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const JUDGE_APP_URL =
  import.meta.env.VITE_JUDGE_APP_URL ?? "https://judgetcg.com.br/judge";

export const PRICING_URL =
  import.meta.env.VITE_PRICING_URL ?? "https://judgetcg.com.br/pricing";
