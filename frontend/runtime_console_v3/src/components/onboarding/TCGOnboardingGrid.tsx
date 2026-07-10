import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock } from "lucide-react";
import Link from "next/link";
import { TcgLogoImage } from "@/components/judge/TcgLogoImage";
import { MagneticButton } from "@/components/luxury/effects/MagneticButton";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { completeOnboarding } from "@/hooks/useCompleteOnboarding";
import { getTcgTheme } from "@/styles/tcg-theme";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
import { FREE_TCG_SELECTION_LIMIT } from "@/lib/plan-limits/constants";
import { TCG_OPTIONS, type TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type Props = {
  selected: TcgType[];
  onChange: (ids: TcgType[]) => void;
  onComplete?: () => void;
};

export function TCGOnboardingGrid({ selected, onChange, onComplete }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useJudgeAuth();
  const { showUpgrade } = useUpgradeModal();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enabledGames = TCG_OPTIONS.filter((g) => g.enabled);

  const toggle = useCallback(
    (id: TcgType) => {
      if (selected.includes(id)) {
        onChange(selected.filter((x) => x !== id));
        return;
      }
      if (selected.length >= FREE_TCG_SELECTION_LIMIT) {
        showUpgrade("tcgs");
        return;
      }
      onChange([...selected, id]);
    },
    [onChange, selected, showUpgrade],
  );

  const confirm = async () => {
    if (selected.length !== FREE_TCG_SELECTION_LIMIT || !user) return;
    setSaving(true);
    setError(null);
    try {
      await completeOnboarding(user, selected);
      await queryClient.invalidateQueries({ queryKey: ["player-profile", "me"] });
      onComplete?.();
      router.replace("/judge");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {enabledGames.map((game) => {
          const active = selected.includes(game.id);
          const lockedOut = !active && selected.length >= FREE_TCG_SELECTION_LIMIT;
          const theme = getTcgTheme(game.id);

          return (
            <button
              key={game.id}
              type="button"
              onClick={() => toggle(game.id)}
              title={
                lockedOut
                  ? "Disponível no plano Pro"
                  : active
                    ? `${game.label} — selecionado`
                    : game.label
              }
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-300",
                active
                  ? "border-primary/60 bg-primary/10 shadow-lg shadow-primary/10"
                  : lockedOut
                    ? "border-border/60 opacity-50 grayscale"
                    : "border-border hover:border-border",
              )}
              style={
                active
                  ? ({
                      boxShadow: `0 0 24px hsl(${theme.accent} / 0.25)`,
                      borderColor: `hsl(${theme.accent} / 0.5)`,
                    } as CSSProperties)
                  : undefined
              }
            >
              {active && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
              )}
              {lockedOut && (
                <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl bg-foreground/40">
                  <Lock className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="rounded-full bg-primary/90 px-2 py-0.5 text-caption font-bold text-primary-foreground">
                    Pro
                  </span>
                </span>
              )}
              <TcgLogoImage tcgId={game.id} variant="compact" selected={active} />
              <span
                className={cn(
                  "text-center text-xs font-medium leading-tight",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {game.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-4 border-t border-border pt-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-primary">{selected.length}</span>
          /{FREE_TCG_SELECTION_LIMIT} selecionados
        </p>
        <MagneticButton
          type="button"
          disabled={selected.length !== FREE_TCG_SELECTION_LIMIT || saving || !user}
          onClick={() => void confirm()}
          className="min-w-[220px]"
        >
          {saving ? "Salvando..." : "Confirmar"}
        </MagneticButton>
        <p className="max-w-md text-center text-xs text-muted-foreground/80">
          TCGs fora da sua seleção ficam disponíveis no{" "}
          <Link href="/pricing" className="text-primary hover:underline">
            plano Pro
          </Link>
          .
        </p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
