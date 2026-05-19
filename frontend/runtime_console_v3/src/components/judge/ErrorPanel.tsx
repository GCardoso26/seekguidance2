"use client";
import { Button } from "@/components/ui/button";

type Props = {
  message: string;
  onRetry?: () => void;
};

export function ErrorPanel({ message, onRetry }: Props) {
  return (
    <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry} className="shrink-0">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
