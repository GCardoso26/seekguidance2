export const runtimeTokens = {
  severity: {
    critical: "text-danger bg-danger/10 border-danger/30",
    high: "text-warning bg-warning/10 border-warning/30",
    medium: "text-primary bg-primary/10 border-primary/30",
    low: "text-muted-foreground bg-muted border-border",
  },
  health: {
    ok: "text-success",
    degraded: "text-warning",
    down: "text-danger",
  },
} as const;
