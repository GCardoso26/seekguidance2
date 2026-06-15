"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useResolveCall } from "@/hooks/useResolveCall";
import type { RulingCategory } from "@/types/judge-calls";
import { useState } from "react";

interface ResolveCallModalProps {
  callId: string;
  callerId?: string | null;
  callerHandle?: string | null;
  open: boolean;
  onClose: () => void;
}

const CATEGORIES: { value: RulingCategory; label: string }[] = [
  { value: "rule_clarification", label: "Esclarecimento de regra" },
  { value: "none", label: "Sem penalidade" },
  { value: "warning", label: "Aviso (Warning)" },
  { value: "game_loss", label: "Game Loss" },
  { value: "match_loss", label: "Match Loss" },
  { value: "disqualification", label: "Desqualificação" },
];

const INFRACTION_TYPES = [
  { value: "slow_play", label: "Slow Play" },
  { value: "deck_error", label: "Erro de Deck" },
  { value: "unsporting_conduct_minor", label: "Conduta (menor)" },
  { value: "unsporting_conduct_major", label: "Conduta (maior)" },
  { value: "cheating", label: "Trapaça" },
];

export function ResolveCallModal({
  callId,
  callerId,
  callerHandle,
  open,
  onClose,
}: ResolveCallModalProps) {
  const { mutate: resolve, isPending } = useResolveCall();
  const [ruling, setRuling] = useState("");
  const [category, setCategory] = useState<RulingCategory | "">("");
  const [infractionType, setInfractionType] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [infractingPlayerId, setInfractingPlayerId] = useState(callerId ?? "");

  if (!open) return null;

  const needsInfraction = category && !["none", "rule_clarification"].includes(category);

  const handleSubmit = () => {
    if (!ruling || !category) return;
    resolve(
      {
        callId,
        ruling,
        rulingCategory: category,
        infractingPlayerId: needsInfraction ? infractingPlayerId.trim() : undefined,
        infractionType: needsInfraction ? infractionType : undefined,
        severity: needsInfraction ? severity : undefined,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <Card className="w-full max-w-lg border-white/10 bg-[#12121a] text-white">
        <CardHeader>
          <CardTitle>Resolver Chamada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-white/70">Ruling / Decisão</label>
            <textarea
              value={ruling}
              onChange={(e) => setRuling(e.target.value)}
              placeholder="Descreva sua decisão..."
              rows={3}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-white/70">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RulingCategory)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            >
              <option value="">Selecione...</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {needsInfraction && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Jogador infrator (ID)</label>
                <input
                  type="text"
                  value={infractingPlayerId}
                  onChange={(e) => setInfractingPlayerId(e.target.value)}
                  placeholder={
                    callerHandle ? `@${callerHandle} (${callerId ?? "sem ID"})` : "ID do jogador (judge_profiles)"
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                />
                {callerId && infractingPlayerId !== callerId && (
                  <button
                    type="button"
                    className="text-xs text-luxury-gold-light/90 hover:text-luxury-gold-light"
                    onClick={() => setInfractingPlayerId(callerId)}
                  >
                    Usar quem abriu a chamada ({callerHandle ? `@${callerHandle}` : callerId})
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Tipo de Infração</label>
                <select
                  value={infractionType}
                  onChange={(e) => setInfractionType(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="">Selecione...</option>
                  {INFRACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Severidade</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                >
                  <option value="minor">Menor</option>
                  <option value="major">Maior</option>
                  <option value="severe">Grave</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={Boolean(
                isPending ||
                  !ruling ||
                  !category ||
                  (needsInfraction && (!infractionType || !infractingPlayerId.trim())),
              )}
              onClick={handleSubmit}
            >
              {isPending ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
