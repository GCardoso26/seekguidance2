/**
 * Toasts leves (sem dependência extra) — evento global para a UI Judge.
 */

export type ToastKind = "success" | "error" | "info";

export type ToastPayload = {
  id: string;
  message: string;
  kind: ToastKind;
};

type Listener = (toast: ToastPayload) => void;

const listeners = new Set<Listener>();

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function showToast(message: string, kind: ToastKind = "info"): void {
  const payload: ToastPayload = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message,
    kind,
  };
  listeners.forEach((fn) => fn(payload));
}
