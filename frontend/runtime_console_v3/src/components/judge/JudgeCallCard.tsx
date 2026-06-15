"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAcceptCall } from "@/hooks/useAcceptCall";
import { useEscalateCall } from "@/hooks/useResolveCall";
import {
  CALL_TYPE_LABELS,
  PRIORITY_COLORS,
  type JudgeCall,
} from "@/types/judge-calls";
import { Clock, MapPin, User } from "lucide-react";
import { useState } from "react";
import { ResolveCallModal } from "./ResolveCallModal";

interface JudgeCallCardProps {
  call: JudgeCall;
  type: "open" | "active" | "resolved";
}

export function JudgeCallCard({ call, type }: JudgeCallCardProps) {
  const { mutate: acceptCall, isPending: accepting } = useAcceptCall();
  const { mutate: escalateCall, isPending: escalating } = useEscalateCall();
  const [resolveOpen, setResolveOpen] = useState(false);

  return (
    <>
      <Card className={call.priority === "urgent" ? "border-red-500/40 bg-red-950/10" : "border-white/10 bg-white/5"}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={PRIORITY_COLORS[call.priority]}>{call.priority.toUpperCase()}</Badge>
                <Badge className="border border-white/20 bg-transparent text-white/80">
                  {CALL_TYPE_LABELS[call.type]}
                </Badge>
                {call.status === "escalated" && (
                  <Badge className="bg-red-600/30 text-red-200">ESCALADO</Badge>
                )}
              </div>

              <h3 className="font-semibold text-white">
                Mesa {call.tableNumber}
                {call.tournamentName ? ` — ${call.tournamentName}` : ""}
              </h3>

              <p className="text-sm text-white/60">{call.description}</p>

              <div className="flex flex-wrap gap-4 text-xs text-white/50">
                {call.callerHandle && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />@{call.callerHandle}
                  </span>
                )}
                {call.roundNumber != null && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Rodada {call.roundNumber}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatElapsed(call.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {type === "open" && (
                <Button size="sm" disabled={accepting} onClick={() => acceptCall(call.id)}>
                  {accepting ? "..." : "Atender"}
                </Button>
              )}
              {type === "active" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setResolveOpen(true)}>
                    Resolver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    disabled={escalating}
                    onClick={() => {
                      const reason = window.prompt("Motivo da escalação:");
                      if (reason?.trim()) escalateCall({ callId: call.id, reason: reason.trim() });
                    }}
                  >
                    Escalar
                  </Button>
                </>
              )}
              {type === "resolved" && (
                <Badge className="bg-luxury-gold/20 text-luxury-gold-light">Resolvido</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {resolveOpen && (
        <ResolveCallModal
          callId={call.id}
          callerId={call.callerId}
          callerHandle={call.callerHandle}
          open={resolveOpen}
          onClose={() => setResolveOpen(false)}
        />
      )}
    </>
  );
}

function formatElapsed(date: string): string {
  const elapsed = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h`;
}
