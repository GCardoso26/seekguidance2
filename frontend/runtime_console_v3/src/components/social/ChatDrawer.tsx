"use client";

import { useState } from "react";
import { useChat } from "@/hooks/useChat";

export function ChatDrawer() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { friends, messages, activeFriend, setActiveFriend, sendMessage } = useChat();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-blue-600 p-3 text-white shadow-lg md:bottom-4"
        aria-label="Mensagens"
      >
        💬
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
          <div className="flex h-full w-full max-w-sm flex-col bg-muted text-foreground shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="font-semibold">Mensagens</h2>
              <button type="button" onClick={() => setOpen(false)} className="min-h-[44px] px-2">
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="w-2/5 overflow-y-auto border-r border-border">
                {friends.map((f: { id: string; display_name?: string; unread?: number }) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFriend(f.id)}
                    className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-muted/80 ${
                      activeFriend === f.id ? "bg-muted/50" : ""
                    }`}
                  >
                    <span>{f.display_name ?? f.id}</span>
                    {(f.unread ?? 0) > 0 && (
                      <span className="rounded-full bg-red-500 px-1.5 text-xs">{f.unread}</span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex-1 space-y-2 overflow-y-auto p-3">
                  {messages.map((m: { id: string; content: string; sender_id: string }) => (
                    <div
                      key={m.id}
                      className={`rounded-lg px-3 py-2 text-sm ${
                        m.sender_id === activeFriend ? "bg-slate-700" : "ml-auto bg-blue-900"
                      }`}
                    >
                      {m.content}
                    </div>
                  ))}
                </div>
                {activeFriend && (
                  <form
                    className="flex gap-2 border-t border-border p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!draft.trim()) return;
                      sendMessage.mutate({ receiverId: activeFriend, content: draft });
                      setDraft("");
                    }}
                  >
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="min-h-[44px] flex-1 surface-card rounded-lg px-3 text-sm"
                      placeholder="Mensagem…"
                    />
                    <button type="submit" className="min-h-[44px] rounded-lg bg-blue-600 px-3 text-sm text-white">
                      Enviar
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
