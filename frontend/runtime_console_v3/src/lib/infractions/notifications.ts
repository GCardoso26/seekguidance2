import type { InfractionReport } from "@/lib/infractions/schema";

export type InfractionListener = (report: InfractionReport) => void;

const listeners = new Map<string, Set<InfractionListener>>();

export function subscribeToInfractions(judgeId: string, callback: InfractionListener): () => void {
  if (!listeners.has(judgeId)) listeners.set(judgeId, new Set());
  listeners.get(judgeId)!.add(callback);
  return () => listeners.get(judgeId)?.delete(callback);
}

export function notifyJudge(report: InfractionReport, judgeIds: string[]): void {
  for (const judgeId of judgeIds) {
    for (const cb of listeners.get(judgeId) ?? []) {
      cb(report);
    }
  }
}

/** Placeholder para Supabase Realtime — integrar com channel `infraction_reports`. */
export function subscribeInfractionsRealtime(
  _judgeId: string,
  _onReport: InfractionListener,
): () => void {
  return () => undefined;
}
