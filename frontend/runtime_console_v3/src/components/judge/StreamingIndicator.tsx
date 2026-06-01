"use client";

interface StreamingIndicatorProps {
  phase: string | null;
}

const PHASE_ICONS: Record<string, string> = {
  embedding: "🔍",
  retrieving: "📚",
  reranking: "⚖️",
  generating: "✍️",
};

function iconForPhase(label: string): string {
  const lower = label.toLowerCase();
  for (const [key, icon] of Object.entries(PHASE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "⏳";
}

export function StreamingIndicator({ phase }: StreamingIndicatorProps) {
  if (!phase) return null;

  return (
    <div className="flex animate-in fade-in items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2 duration-200">
      <span className="text-sm" aria-hidden>
        {iconForPhase(phase)}
      </span>
      <span className="text-xs text-muted-foreground">{phase}</span>
      <span className="ml-auto flex gap-0.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/50"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </div>
  );
}
