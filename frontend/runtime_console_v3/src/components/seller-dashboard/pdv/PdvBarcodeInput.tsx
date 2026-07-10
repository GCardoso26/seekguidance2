"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { classifyBarcodeInput, type BarcodeInputMode } from "@/lib/pdv-barcode";

type Feedback = "idle" | "found" | "not_found" | "manual";

type Props = {
  onScan: (code: string, mode: BarcodeInputMode) => boolean | Promise<boolean>;
  disabled?: boolean;
};

export function PdvBarcodeInput({ onScan, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const keyTimesRef = useRef<number[]>([]);
  const [value, setValue] = useState("");
  const [feedback, setFeedback] = useState<Feedback>("idle");

  const refocus = useCallback(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  useEffect(() => {
    refocus();
  }, [refocus]);

  async function commit(code: string, mode: BarcodeInputMode) {
    const trimmed = code.trim();
    if (!trimmed) return;

    setFeedback("idle");
    try {
      const found = await onScan(trimmed, mode);
      setFeedback(found ? (mode === "scan" ? "found" : "manual") : "not_found");
    } catch {
      setFeedback("not_found");
    }
    setValue("");
    keyTimesRef.current = [];
    refocus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const mode = classifyBarcodeInput(keyTimesRef.current, value);
      void commit(value, mode);
      return;
    }
    if (e.key.length === 1) {
      keyTimesRef.current.push(performance.now());
    }
  }

  const borderClass =
    feedback === "found"
      ? "border-emerald-500/60"
      : feedback === "not_found"
        ? "border-red-500/60"
        : feedback === "manual"
          ? "border-amber-500/40"
          : "border-primary/40";

  return (
    <div className="space-y-2" data-testid="pdv-barcode-input">
      <label htmlFor="pdv-barcode-field" className="text-xs font-semibold uppercase text-muted-foreground">
        Código de barras / SKU
      </label>
      <input
        id="pdv-barcode-field"
        ref={inputRef}
        type="text"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(refocus, 10)}
        placeholder="Escaneie ou digite o código e pressione Enter…"
        className={`w-full rounded-lg border-2 bg-black/40 px-4 py-3 font-mono text-lg text-white outline-none transition ${borderClass}`}
        data-testid="pdv-barcode-field"
      />
      {feedback === "found" && (
        <p className="text-sm text-emerald-400" data-testid="pdv-barcode-feedback-found">
          Produto adicionado ao carrinho.
        </p>
      )}
      {feedback === "not_found" && (
        <p className="text-sm text-red-400" data-testid="pdv-barcode-feedback-error">
          Produto não encontrado. Tente a busca textual abaixo.
        </p>
      )}
      {feedback === "manual" && (
        <p className="text-sm text-amber-300/90">Entrada manual — Enter para buscar.</p>
      )}
    </div>
  );
}
