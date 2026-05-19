"use client";
import { Button } from "@/components/ui/button";

type Props = {
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function AskButton({ loading, disabled, onClick }: Props) {
  return (
    <Button
      type="button"
      className="w-full sm:w-auto min-w-[140px]"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? "A consultar…" : "Perguntar"}
    </Button>
  );
}
