"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { SellerHeader } from "@/components/seller-dashboard/SellerHeader";
import {
  useCreateTicket,
  useSupportTickets,
  useTicketDetail,
  type SupportTicket,
} from "@/hooks/useSupportTickets";
import { cn } from "@/lib/utils";
import {
  ticketStatusLabel,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/lib/ticket-labels";

const TICKET_TABS = [
  { id: "", label: "Todos" },
  { id: "open", label: "Abertos" },
  { id: "in_progress", label: "Em atendimento" },
  { id: "waiting_customer", label: "Aguardando cliente" },
  { id: "resolved", label: "Resolvidos" },
  { id: "closed", label: "Fechados" },
];

function TicketDrawer({
  ticketId,
  open,
  onOpenChange,
}: {
  ticketId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data } = useTicketDetail(ticketId);
  const ticket = data?.ticket as Record<string, unknown> | undefined;
  const messages = (data?.messages ?? []) as Array<{
    content: string;
    author_type: string;
    is_internal?: boolean;
  }>;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-white/10 bg-luxury-onyx">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              Ticket #{ticketId?.slice(0, 8)}
            </Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {ticket && (
              <p className="font-medium">{String(ticket.subject)}</p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-lg p-2",
                  m.is_internal ? "bg-amber-500/10" : "bg-white/5",
                )}
              >
                <span className="text-xs text-luxury-mist">[{m.author_type}] </span>
                {m.content}
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TicketsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [showCreate, setShowCreate] = useState(searchParams.get("action") === "new");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (searchParams.get("action") === "new") setShowCreate(true);
  }, [searchParams]);

  const { data, isLoading } = useSupportTickets(status || undefined);
  const createTicket = useCreateTicket();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createTicket.mutateAsync({ subject, category: "other", priority: "medium" });
      toast.success("Ticket criado");
      setShowCreate(false);
      setSubject("");
    } catch {
      toast.error("Erro ao criar ticket");
    }
  }

  return (
    <>
      <SellerHeader
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx"
          >
            + Novo Ticket
          </button>
        }
      />
      <PageShell>
        <PageHeader title="Tickets" description="Atendimento ao cliente." />
        <div className="flex flex-wrap gap-1">
          {TICKET_TABS.map((t) => (
            <button
              key={t.id || "all"}
              type="button"
              onClick={() => setStatus(t.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                status === t.id ? "bg-luxury-gold/20 text-luxury-gold" : "text-luxury-mist hover:bg-white/5",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <label className="block text-sm">
              Assunto
              <input
                required
                aria-label="Assunto"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              />
            </label>
            <div className="mt-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx">
                Criar
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="text-sm text-luxury-mist">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <p className="text-sm text-luxury-mist">Carregando…</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-left text-luxury-mist">
                <tr>
                  <th className="p-3">Ticket</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Prioridade</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.tickets ?? []).map((t) => (
                  <tr
                    key={t.id}
                    className="cursor-pointer border-t border-white/10 hover:bg-white/[0.03]"
                    onClick={() => setSelected(t)}
                  >
                    <td className="p-3">{t.subject}</td>
                    <td className="p-3">{t.customer_name ?? "—"}</td>
                    <td className="p-3">{TICKET_CATEGORY_LABELS[t.category] ?? t.category}</td>
                    <td className="p-3">{TICKET_PRIORITY_LABELS[t.priority] ?? t.priority}</td>
                    <td className="p-3">{ticketStatusLabel(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageShell>
      <TicketDrawer
        ticketId={selected?.id ?? null}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </>
  );
}
