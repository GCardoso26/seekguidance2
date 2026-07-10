"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

function MessagesList() {
  const { friends, activeFriend, setActiveFriend, messages, sendMessage } = useChat();
  const [text, setText] = useState("");

  const send = async () => {
    if (!activeFriend || !text.trim()) return;
    await sendMessage.mutateAsync({ receiverId: activeFriend, content: text.trim() });
    setText("");
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <ul className="luxury-card rounded-xl p-3 md:col-span-1">
        {friends.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nenhum amigo ainda.</li>}
        {friends.map((f: { id: string; handle?: string; display_name?: string; unread?: number }) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => setActiveFriend(f.id)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                activeFriend === f.id ? "bg-primary/15 text-primary-light" : "hover:bg-muted/80"
              }`}
            >
              <span>@{f.handle ?? f.display_name ?? f.id.slice(0, 8)}</span>
              {(f.unread ?? 0) > 0 && (
                <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{f.unread}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div className="luxury-card flex min-h-[400px] flex-col rounded-xl p-4 md:col-span-2">
        {!activeFriend && <p className="text-sm text-muted-foreground">Selecione uma conversa.</p>}
        {activeFriend && (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {messages.map((m: { id: string; content: string; sender_id: string; created_at?: string }) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.sender_id === activeFriend ? "bg-muted" : "ml-auto bg-primary/20"
                  }`}
                >
                  {m.content}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Mensagem…"
                className="luxury-input flex-1"
                onKeyDown={(e) => e.key === "Enter" && void send()}
              />
              <Button className="bg-primary text-primary-foreground" onClick={() => void send()}>
                Enviar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ChatWithUser({ userId }: { userId: string }) {
  const { messages, sendMessage } = useChat();
  const [text, setText] = useState("");

  return (
    <div className="luxury-card min-h-[400px] rounded-xl p-4">
      <p className="text-sm text-muted-foreground">Conversa com {userId.slice(0, 8)}…</p>
      <div className="mt-4 space-y-2">
        {messages.map((m: { id: string; content: string }) => (
          <p key={m.id} className="text-sm">
            {m.content}
          </p>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} className="luxury-input flex-1" />
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => void sendMessage.mutateAsync({ receiverId: userId, content: text })}
        >
          Enviar
        </Button>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const params = useParams();
  const userId = params?.userId ? String(params.userId) : null;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Link href="/social" className="text-sm text-muted-foreground">
          ← Social
        </Link>
        <h1 className="mt-4 text-2xl font-light text-foreground">Mensagens</h1>
        <div className="mt-6">{userId ? <ChatWithUser userId={userId} /> : <MessagesList />}</div>
      </div>
    </MobileLayout>
  );
}
